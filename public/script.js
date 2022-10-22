
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '192.168.10.106',
    port: '443',
})
const myVideo = document.createElement('video')
myVideo.muted = false

const speech = new webkitSpeechRecognition();
speech.lang = 'ja-JP';

const peers = {}

let USER_ID = ""

//get information of Media(web camera)
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
        call.answer(stream)
        
        //show video on the browser
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    //aroww to be connected to other users
    socket.on('user-connected', userId => {
        console.log('connected')
        connectToNewUser(userId, stream)
    })

    // when user disconnect
    socket.on('user-disconnected', userId => {
        console.log('user-disconnected', userId)
        if(peers[userId]) peers[userId].close()
    })

    let pLi = $('.chat-box')

    $('#message-btn').on('click', () => {
        let text = $('#chat-message')
        let msg = text.val()
        if(msg.length !== 0) {
            socket.emit('message', msg, USER_NAME)
            text.val('')
        }
    })

    $('#mute-btn').on('click', () => {
        const enabled = stream.getAudioTracks()[0].enabled
        if(enabled) {
            stream.getAudioTracks()[0].enabled = false
            $('#mute-btn').addClass('clicked')
        } else {
            stream.getAudioTracks()[0].enabled = true
            $('#mute-btn').removeClass('clicked')
        }
    })

    socket.on('create-message', (message, userName) => {
        if(userName == USER_NAME) {
            pLi.append(`<li class="message own-message"><span>Me</span><p>${message}</p></li>`)
        }
        else {
            pLi.append(`<li class="message"><span>${userName}</span><p>${message}</p></li>`)
        }
        var d = $('.chat-box')
        d.scrollTop(d.prop("scrollHeight"))
        
    })
    
})

// when connection is opened, id is generated automatically
myPeer.on('open', id => {
    USER_ID = id
    console.log(`OPEN, roomId:${ROOM_ID}, Id:${id}, userName:${USER_NAME}`)
    socket.emit('join-room', ROOM_ID, id, USER_NAME)
})

$('#invite-btn').on('click', () => {
    if($('#invite-info').hasClass('hide')) {
        $('#invite-btn').addClass('clicked')
        $('#invite-url').val(location.href)
        $('#invite-info').removeClass('hide')
    }
    else {
        $('#invite-btn').removeClass('clicked')
        $('#invite-info').addClass('hide')
    }
})

$('#leave-btn').on('click', () => {
    location = '../user-name';
})

//----------
//functions
//----------
function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    
    call.on('stream', userVideoStream => {
        console.log('into call stream')
        // peer.call and the callback of the call event provide 
        // a MediaConnection object. The MediaConnection object 
        // itself emits a stream event whose callback includes 
        // the video/audio stream of the other peer.
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        console.log('close() is called')
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    console.log('get stream')
    video.addEventListener('loadedmetadata', () => {
        video.play()
        speech.start();
    })
    
    videoGrid.append(video)
}

function muteUnmute(myVideoStream) {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

speech.onresult = function(e) {
    speech.stop();
    if(e.results[0].isFinal){
        var autotext =  e.results[0][0].transcript
        
        $('#speach-grid').html('<p>'+ autotext +'</>');
     }
}

speech.onend = () => { 
    speech.start() 
 };


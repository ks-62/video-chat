
window.onload = function() {
    
    var query = location.search
    var value = query.split('=')
    let roomId = value[1]

    if(roomId) {
        $('#room-id').val(roomId)
    }
}



const socket = io();
const logedusersEmail = $("#email").val();
const sender = $("#sender").val();
const logedName = $("#logedName").val();
const reciver = $("#reciver").val();


const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})
const autoScroll = () => {
    // const newMessage = $(".message:last-child")[0];
    // const newMessageStyle = getComputedStyle(newMessage);
    // const newMessageHeight = newMessage.offsetHeight;

    // const visibleHeight = $(".chat-history")[0].offsetHeight;
    // const containerHeight = $(".chat-history")[0].scrollHeight;

    // const scrollOffset = $(".chat-history")[0].scrollTop + visibleHeight;

    // $(".chat-history")[0].scrollTop = containerHeight;
    // if (containerHeight - newMessageHeight <= scrollOffset) {
    // }
}

socket.on("message", (message) => {
    const template = $("#message-template").html();
    const html = Mustache.render(template, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        senderClass: (message.username == "Admin") ? "admin" : (sender == message.from ? "other-message float-right" : "my-message")
    });
    const messagesContainer = $("#messages")[0];
    messagesContainer.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on("LocationMessage", (message) => {
    const template = $("#Locationmessage-template").html();
    const html = Mustache.render(template, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        senderClass: (message.username == "Admin") ? "admin" : (sender == message.from ? "other-message float-right" : "my-message")
    });
    const messagesContainer = $("#messages")[0];
    messagesContainer.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on("roomData", ({ room, users }) => {
    const template = $("#sidebar-template").html();
    const html = Mustache.render(template, {
        room,
        users
    });
    $("#chat-sidebar").html(html);
})

$("#messageForm").on("submit", (e) => {
    e.preventDefault();
    $('#send-message').attr('disabled', 'disabled');
    const message = $("#message").val();
    const from = sender;
    const to = $("#reciver").val();
    socket.emit("sendMessage", { message, from, to }, (msg) => {
        $('#message').val("");
        $('#message').focus();
    });
    $('#send-message').removeAttr('disabled');
});
$("#send-location").on("click", () => {
    $('#send-location').attr('disabled', 'disabled');
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const from = sender;
        const to = $("#reciver").val();
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            from,
            to
        }, (msg) => {
            $('#send-location').removeAttr('disabled');
        })
    })
});

const changeReciver = (reciver) => {
    socket.emit("chatUserDetails", { reciver, sender }, (userDetails) => {
        const { name, profile } = userDetails[0];
        const template = $("#profile-template").html();
        const html = Mustache.render(template, {
            name,
            profile
        });
        $("#profileDetails").html(html);
    })
    socket.emit("getconversation", { sender, reciver, sender }, (messages) => {
        const template = $("#messages-template").html();
        const html = Mustache.render(template, { messages });
        $("#messages").html(html);
    })
    $("#reciver").val(reciver)
    $('.userList').removeClass('active');
    $("#" + reciver).addClass("active");
    autoScroll();
}

socket.emit("join", sender, (error) => {
    changeReciver(sender);
    if (error.code == 400) {
        alert(error.code);
        location.href = "/";
    } else {
        sessionStorage.setItem("logedUser", error.userId);
    }

})
$("#self-settings-icon").on("click", () => {
    console.log('settings clicked');
})
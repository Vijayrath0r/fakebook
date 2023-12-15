const socket = io();
const logedusersEmail = $("#email").val();
const sender = $("#sender").val();
const logedName = $("#logedName").val();
const reciver = $("#reciver").val();
const textTemplate = $("#message-template").html();
const Locationtemplate = $("#Locationmessage-template").html();
const sideBarTemplate = $("#sidebar-template").html();
const messagesContainer = $("#messages")[0];



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
const showMessages = (message) => {
    if (message.messageType) {
        const html = Mustache.render(Locationtemplate, {
            username: message.name,
            message: message.message,
            createdAt: message.createdAt,
            senderClass: message.senderClass,
            dateClass: message.dateClass
        });
        messagesContainer.insertAdjacentHTML('beforeend', html);
        console.log('Location');
    } else {
        const html = Mustache.render(textTemplate, {
            username: message.name,
            message: message.message,
            createdAt: message.createdAt,
            senderClass: message.senderClass,
            dateClass: message.dateClass
        });
        messagesContainer.insertAdjacentHTML('beforeend', html);
        console.log('text');
    }
}

socket.on("message", (message) => {
    const tempMessage = {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        senderClass: sender == message.from ? "other-message float-right" : "my-message",
        dateClass: sender == message.from ? "text-right" : "text-left",
        messageType: 0
    }
    showMessages(tempMessage)
});

socket.on("LocationMessage", (message) => {
    const tempMessage = {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        senderClass: sender == message.from ? "other-message float-right" : "my-message",
        dateClass: sender == message.from ? "text-right" : "text-left",
        messageType: 1
    }
    showMessages(tempMessage)
});

socket.on("roomData", ({ room, users }) => {
    console.log('users - ', users);
    const html = Mustache.render(sideBarTemplate, {
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
        $("#messages").html('');
        messages.forEach(message => {
            showMessages(message);
        });
        // const template = $("#messages-template").html();
        // const html = Mustache.render(template, { messages });
        // $("#messages").html(html);
    })
    $("#reciver").val(reciver)
    $('.userList').removeClass('active');
    $("#" + reciver).addClass("active");
    // autoScroll();
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
const socket = io();
var typingTimer;
let typingTimeout;
var doneTypingInterval = 500;
const logedusersEmail = $("#email").val();
const sender = $("#sender").val();
const logedName = $("#logedName").val();
const reciver = $("#reciver").val();
const textTemplate = $("#message-template").html();
const Locationtemplate = $("#Locationmessage-template").html();
const sideBarTemplate = $("#sidebar-template").html();
const messagesContainer = $("#messages")[0];
const addContactTemplate = $("#addContact-template").html();
const addContactListTemplate = $("#addContactList-template").html();



const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})
const autoScroll = () => {
    const newMessage = $("#messages li:last-child")[0];
    // const newMessageStyle = getComputedStyle(newMessage);
    const newMessageHeight = newMessage.offsetHeight;

    const visibleHeight = $("#messages")[0].offsetHeight;
    const containerHeight = $("#messages")[0].scrollHeight;

    const scrollOffset = $("#messages")[0].scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight - 29 <= scrollOffset) {
        $("#messages")[0].scrollTop = containerHeight;
    }
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
    } else {
        const html = Mustache.render(textTemplate, {
            username: message.name,
            message: message.message,
            createdAt: message.createdAt,
            senderClass: message.senderClass,
            dateClass: message.dateClass
        });
        messagesContainer.insertAdjacentHTML('beforeend', html);
    }
}

function showNotification(userName, message) {
    if (!window.Notification) {
        console.log('Browser does not support notifications.');
    } else {
        if (Notification.permission === 'granted') {
            var notify = new Notification(userName, {
                body: message,
                icon: '/images/logo-min.jpg',
            });
        } else {
            Notification.requestPermission().then(function (p) {
                if (p === 'granted') {
                    var notify = new Notification(userName, {
                        body: message,
                        icon: '/images/logo-min.jpg',
                    });
                } else {
                    console.log('User blocked notifications.');
                }
            }).catch(function (err) {
                console.error(err);
            });
        }
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
    // $('.chat-history').animate({ scrollTop: 9999 }, 'slow');
    autoScroll();
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
    // $('.chat-history').animate({ scrollTop: 9999 }, 'slow');
    autoScroll();
});

socket.on("roomData", ({ users }) => {
    const html = Mustache.render(sideBarTemplate, { users }); $("#chat-sidebar").html(html);
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
    $(".ms-headerBtn").show();
    $(".chat-message").show();
    socket.emit("getconversation", { sender, reciver, sender }, (messages) => {
        $("#messages").html('');
        messages.forEach(message => {
            showMessages(message);
        });
        // $('.chat-history').animate({ scrollTop: 9999 }, 'slow');
        // const template = $("#messages-template").html();
        // const html = Mustache.render(template, { messages });
        // $("#messages").html(html);
        autoScroll();
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
})

$("#refreshContacts").on("click", () => {
    if (!$("#refreshContacts").hasClass("fa-spin")) {
        $("#refreshContacts").addClass('fa-spin');
        socket.emit("updateUserList", { sender }, (message) => {
            $("#refreshContacts").removeClass('fa-spin');
        })
    }
})

$("#message").on("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
        const reciver = $("#reciver").val();
        socket.emit("typingSever", { sender, reciver })
    }, doneTypingInterval);
});

socket.on("typingClient", ({ senderTyping, reciverTyping }) => {
    if (reciverTyping == sender) {
        $("#" + senderTyping + " .waviy").css("visibility", "visible");
    }
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    typingTimeout = setTimeout(() => {
        $("#" + senderTyping + " .waviy").css("visibility", "hidden");
        typingTimeout = null;
    }, 2000);
})

socket.on("showNotification", ({ senderNotifincation, reciverNotification, userName, message }) => {
    if (sender == reciverNotification) {
        if ($("#reciver").val() != senderNotifincation) {
            showNotification(userName, message);
        }
    }
})

$("#addContacts").on("click", () => {
    $("#profileDetails").html("<h2>add contact</h2>")
    $(".ms-headerBtn").hide();
    $(".chat-message").hide();
    const html = Mustache.render(addContactTemplate, { name: "vijay" })
    $("#messages").html(html)
})

$(document.body).on('click', '#searchContactbtn', function () {
    let searchText = $('#searchContactInput').val();
    socket.emit("findContacts", { sender, searchText }, (userList) => {
        console.log(userList);
        const html = Mustache.render(addContactListTemplate, { userList })
        $("#searchResult").html(html)
    })
})
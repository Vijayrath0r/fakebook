const socket = io();
var typingTimer;
let typingTimeout;
var doneTypingInterval = 500;
const logedusersEmail = $("#email").val();
const sender = $("#sender").val();
const senderId = $("#senderId").val();
const logedName = $("#logedName").val();
const reciver = $("#reciver").val();
const textTemplate = $("#message-template").html();
const Locationtemplate = $("#Locationmessage-template").html();
const sideBarTemplate = $("#sidebar-template").html();
const messagesContainer = $("#messages")[0];
const addContactTemplate = $("#addContact-template").html();
const addContactListTemplate = $("#addContactList-template").html();
const friendRequestListTemplate = $("#friendRequestList-template").html();
const unReadLineTemplate = $("#unReadLine-template").html();



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
            messageId: message.messageId,
            username: message.name,
            message: message.message,
            createdAt: message.createdAt,
            senderClass: message.senderClass,
            dateClass: message.dateClass
        });
        messagesContainer.insertAdjacentHTML('beforeend', html);
    } else {
        const html = Mustache.render(textTemplate, {
            messageId: message.messageId,
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
        // 'Browser does not support notifications.';
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
                    // 'User blocked notifications.'
                }
            }).catch(function (err) {
            });
        }
    }
}
async function updateRequestStatus(from, to, status, elementObj) {
    socket.emit("updateRequestStatus", { from, to, status }, (res) => {
        if (status == '2') {
            $(elementObj).closest('.searchContact').html(`<div class="alert alert-primary" role="alert">Request Accepted</div>`);
        } else if (status == '3') {
            $(elementObj).closest('.searchContact').html(`<div class="alert alert-danger" role="alert">Request Rejected</div>`);
        }
        $(elementObj).closest('.searchContact').removeClass("searchContact");
    })
}

socket.on("message", (message) => {
    const tempMessage = {
        messageId: message.messageId,
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        senderClass: sender == message.from ? "my-message float-right" : "other-message",
        dateClass: sender == message.from ? "text-right" : "text-left",
        messageType: 0
    }
    showMessages(tempMessage)
    // $('.chat-history').animate({ scrollTop: 9999 }, 'slow');
    $("#refreshContacts").click();
    autoScroll();
});

socket.on("LocationMessage", (message) => {
    const tempMessage = {
        messageId: message.messageId,
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        senderClass: sender == message.from ? "my-message float-right" : "other-message",
        dateClass: sender == message.from ? "text-right" : "text-left",
        messageType: 1
    }
    showMessages(tempMessage)
    // $('.chat-history').animate({ scrollTop: 9999 }, 'slow');
    $("#refreshContacts").click();
    autoScroll();
});

socket.on("roomData", ({ users }) => {
    const html = Mustache.render(sideBarTemplate, { users }); $("#chat-sidebar").html(html);
    $(".unreadcount").each(function () {
        if ($(this).html() == '') {
            $(this).hide();
        }
    });
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
    socket.emit("getconversation", { sender, reciver, sender }, ({ messages, lastReadMessageId }) => {
        $("#messages").html('');
        messages.forEach(message => {
            showMessages(message);
        });
        if (lastReadMessageId) {
            eletemntArray = $("#" + lastReadMessageId).nextAll(".clearfix.text-left");
            if (eletemntArray && eletemntArray.length > 0) {
                eletemntArray[0].insertAdjacentHTML('beforebegin', unReadLineTemplate);
            }
        }
        if (messages.length > 0) {
            $('.chat-history').animate({ scrollTop: 9999 }, 'slow');
            autoScroll();
        }
    })
    $("#reciver").val(reciver)
    $('.userList').removeClass('active');
    $("#" + reciver).addClass("active");
    $("#refreshContacts").click();
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
    socket.emit("getRequestCount", { sendTo: senderId }, (count) => {
        $('#friendsRequestRecived').attr('data-requestcount', count);
    })
    const html = Mustache.render(addContactTemplate, { name: "vijay" })
    $("#messages").html(html)
})

$(document.body).on('click', '#searchContactbtn', function () {
    let searchText = $('#searchContactInput').val();
    socket.emit("findContacts", { sender, searchText }, (userList) => {
        const html = Mustache.render(addContactListTemplate, { userList })
        $("#searchResult").html(html)
    })
})
$("#logoutButton").on("click", () => {
    Swal.fire({
        title: "Are you sure?",
        text: "You want to logout.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Logout"
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.replace("/logout");
        }
    });
})

$(".chat-history").on("click", '.fa-user-plus', function () {
    let reciver = $(this).data("personalid");
    $(this).removeClass("fa-user-plus");
    $(this).addClass("fa-spinner fa-pulse");
    socket.emit("addFriendRequest", { senderId, reciver }, (msg) => {
        setTimeout(() => {
            $(this).removeClass("fa-spinner fa-pulse");
            $(this).addClass("fa-user-times");
        }, 500);
    })
})
$(".chat-history").on("click", '#friendsRequestRecived', function () {

    socket.emit("getRequestList", { sendTo: senderId }, (userList) => {
        if (userList.length > 0) {
            const html = Mustache.render(friendRequestListTemplate, { userList })
            $("#searchResult").html(html)
        } else {
            $("#searchResult").html(`<div class="alert alert-secondary m-5" role="alert">No Pending Requests!</div>`)
        }
    })
})

$(".chat-history").on("click", '.acceptBtn', async function () {
    let fromRequest = $(this).attr('data-personalId');
    updateRequestStatus(fromRequest, senderId, '2', this);
})

$(".chat-history").on("click", '.rejectBtn', async function () {
    let fromRequest = $(this).attr('data-personalId');
    updateRequestStatus(fromRequest, senderId, '3', this);
})
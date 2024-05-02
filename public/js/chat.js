const socket = io();
var typingTimer;
let typingTimeout;
var doneTypingInterval = 500;
let selectedImageFiles = [];
const logedusersEmail = $("#email").val();
const sender = $("#sender").val();
const senderId = $("#senderId").val();
const logedName = $("#logedName").val();
const reciver = $("#reciver").val();
const textTemplate = $("#message-template").html();
const Locationtemplate = $("#Locationmessage-template").html();
const picturetemplate = $("#picturemessage-template").html();
const sideBarTemplate = $("#sidebar-template").html();
const messagesContainer = $("#messages")[0];
const addContactTemplate = $("#addContact-template").html();
const addContactListTemplate = $("#addContactList-template").html();
const friendRequestListTemplate = $("#friendRequestList-template").html();
const unReadLineTemplate = $("#unReadLine-template").html();


$("#send-picture-container").hide();
$("#send-picture-message").hide();
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
const renderMessage = (message, template) => {
    const html = Mustache.render(template, {
        messageId: message.messageId,
        username: message.name,
        message: message.message,
        createdAt: message.createdAt,
        senderClass: message.senderClass,
        dateClass: message.dateClass
    });
    messagesContainer.insertAdjacentHTML('beforeend', html);
};

const showMessages = (message) => {
    let template;
    switch (message.messageType) {
        case 2:
            template = picturetemplate;
            break;
        case 1:
            template = Locationtemplate;
            break;
        default:
            template = textTemplate;
            break;
    }
    renderMessage(message, template);
};

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

function openProfileModal(reciver) {
    socket.emit("chatUserDetails", { reciver, sender }, (userDetails) => {
        const { name, profile } = userDetails[0];
        $('#profileImage').attr('src', "images/" + profile + ".svg");
        // Populate profile name
        $('#profileName').text(name);
    })
    setTimeout(function () {
        $('#profileModal').modal('show');
    }, 230);
}

socket.on("message", (message) => {
    if ($("#reciver").val() == message.from || sender == message.from) {
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
    }
    // $('.chat-history').animate({ scrollTop: 9999 }, 'slow');
    $("#refreshContacts").click();
    autoScroll();
});

socket.on("LocationMessage", (message) => {
    if ($("#reciver").val() == message.from || sender == message.from) {
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
    }
    // $('.chat-history').animate({ scrollTop: 9999 }, 'slow');
    $("#refreshContacts").click();
    autoScroll();
});

socket.on("PictureMessage", (message) => {
    if ($("#reciver").val() == message.from || sender == message.from) {
        const tempMessage = {
            messageId: message.messageId,
            username: message.username,
            message: message.text,
            createdAt: moment(message.createdAt).format("h:mm a"),
            senderClass: sender == message.from ? "my-message float-right" : "other-message",
            dateClass: sender == message.from ? "text-right" : "text-left",
            messageType: 2
        }
        showMessages(tempMessage)
    }
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

$("#send-message").on("click", () => {
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

$("#send-picture-message").on("click", () => {
    $('#send-picture-message').attr('disabled', 'disabled');
    // const message = $("#message").val();
    // const from = sender;
    // const to = $("#reciver").val();
    // socket.emit("sendMessage", { message, from, to }, (msg) => {
    //     $('#message').val("");
    //     $('#message').focus();
    // });
    $('#send-picture-message').removeAttr('disabled');
});

const changeReciver = (reciver) => {
    $("#send-picture-container").hide();
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
    if ($(window).width() < 767) {
        $(".people-list").hide();
        $(".chat").show();
    }
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
    $("#profileDetails").html(`<a id="backBtn"><i class="fa fa-arrow-left"></i></a><h2>add contact</h2>`)
    $(".ms-headerBtn").hide();
    $(".chat-message").hide();
    socket.emit("getRequestCount", { sendTo: senderId }, (count) => {
        $('#friendsRequestRecived').attr('data-requestcount', count);
    })
    const html = Mustache.render(addContactTemplate, { name: "vijay" })
    $("#messages").html(html)
    if ($(window).width() < 767) {
        $(".people-list").hide();
        $(".chat").show();
    }
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

$("body").on("click", '#backBtn', async function () {
    $(".people-list").show();
    $(".chat").hide();
});


$("#send-picture-icon").on("click", () => {
    const isOpen = $("#send-picture-icon").attr("data-open");
    const slideDuration = 200;

    // Toggle slide and classes based on isOpen state
    if (isOpen === "0") {
        $("#send-picture-container").slideDown(slideDuration).addClass("active");
        $("#message").parent().hide();
        $("#send-message").hide();
        $("#send-picture-message").show().parent().css("flex", "1");
    } else {
        $("#send-picture-container").slideUp(slideDuration).removeClass("active");
        $("#message").parent().show();
        $("#send-message").show();
        $("#send-picture-message").hide().parent().css("flex", "0");
    }

    // Toggle the isOpen state
    $("#send-picture-icon").attr("data-open", isOpen === "1" ? "0" : "1");
});




let isDown = false;
let startX;
let scrollLeft;

$("#send-picture-container").on('mousedown touchstart', (e) => {
    console.log("mouse/touch down");
    isDown = true;
    startX = e.pageX || e.originalEvent.touches[0].pageX;
    scrollLeft = $("#send-picture-container").scrollLeft();
});

$(document).on('mouseup touchend', () => {
    console.log("mouse/touch up");
    isDown = false;
});

$(document).on('mousemove touchmove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX || e.originalEvent.touches[0].pageX;
    const walk = (x - startX); // Adjust scrolling speed as needed
    $("#send-picture-container").scrollLeft(scrollLeft - walk);
});

// Function to display image preview
function displayImagePreview(file) {
    selectedImageFiles.push(file); // Add the selected file to the list
    const imageBlock = $('<div>').addClass('imageBlock').css('position', 'relative');
    const img = $('<img>').attr('src', URL.createObjectURL(file)).attr('alt', '');
    const removeButton = $('<i>').addClass('removeSelectedImage fa-solid fa-circle-xmark').attr('data-file-name', file.name);

    removeButton.click(function () {
        const fileName = $(this).data('file-name');
        selectedImageFiles = selectedImageFiles.filter(item => item.name !== fileName); // Remove the file from the selected files list
        $(this).closest('.imageBlock').remove(); // Remove the parent image block
    });

    imageBlock.append(img);
    imageBlock.append(removeButton);
    $('#send-picture-container-main').prepend(imageBlock); // Prepend image block to show the last selected image at the beginning
}

// Event listener for file input change
$('#selectImageBtnInput').change(function (event) {
    const files = event.target.files;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        displayImagePreview(file);
    }
});

$('#send-picture-message').click(function () {
    const formData = new FormData();

    const from = sender;
    const to = $("#reciver").val();

    // Append all selected files to the FormData object
    for (let i = 0; i < selectedImageFiles.length; i++) {
        formData.append('images', selectedImageFiles[i]);
    }

    // Send the FormData object to the backend using AJAX
    $.ajax({
        url: '/messages/uploadImages',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            const fileList = response.fileList;
            fileList.forEach((message) => {
                socket.emit("sendPictureMessage", { message, from, to }, (msg) => {

                })
                console.log(message);
            })
            $("#send-picture-container-main").html("");
            $("#send-picture-icon").click();
        },
        error: function (error) {
            console.error('Error submitting images:', error);
        }
    });
});

// Event listener for Select Images button click
$('#selectImageBtn').click(function () {
    $('#selectImageBtnInput').click(); // Trigger file input click
});

// Handle click on image block to display full screen image
$(document).on('click', '.imageBlock img,.messageImage', function () {
    const src = $(this).attr('src');
    $('#fullScreenImage').attr('src', src);
    $('#imageModal').fadeIn(); // Fade in the modal
});

$('.imageModalClose, #imageModal').on('click', function () {
    $('#imageModal').fadeOut(); // Fade out the modal
});

// Prevent modal from closing when clicking on the image content
$(' #imageModal .modal-content').on('click', function (e) {
    e.stopPropagation();
});
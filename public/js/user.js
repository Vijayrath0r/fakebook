$('.profileOptions').click(function () {
    var id = $(this).attr('id');
    $('.profileOptions').removeClass('selectedProfile');
    $("#" + id).addClass('selectedProfile');
    $("#profile").val(id);
})
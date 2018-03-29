const $modal = $('#myModal');
const $addNewLink = $("#addNewLink");
let locTable;
let map;


$(document).ready(() => {
    locTable = new LocationsTable();
});

$addNewLink.on('click', (e) => {
    map = new Map();
    map.initialize();
});

$modal.on('modal:close', () => {
    map.destroy();
});

const closeModal = () => {
    $('.close-modal').click();
};

const openModal = () => {
    $('#openModalHiddenLink').click();
};
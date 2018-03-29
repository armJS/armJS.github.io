function LocationsTable() {
    const $tbody = $("#locationsTable").find("tbody");
    const rowsData = [];
    this.addRow = (data) => {
        rowsData.push({address: data.address, shapePaths: data.shapePaths, location: data.location});
        $tbody.append(prepareRow(data));
    };

    this.updateRow = (data, index) => {
        let $updatedRow = $($tbody.find('tr').get(index));
        rowsData[index] = {address: data.address, shapePaths: data.shapePaths, location: data.location};
        $updatedRow.after(prepareRow(data, index));
        $updatedRow.remove();
    };

    $tbody.on('click', '.edit', (e) => {
        let index = parseInt($(e.target).parent('tr').data('index'));
        map.updateUserSelection(rowsData[index], index)
    });

    const prepareRow = (data, index) => {
        let ind = index !== undefined ? index : $tbody.find('tr').length;
        return `<tr data-index='${ind}'>
                <td class="edit">&#9998;</td>
                <td>${data.address}</td>
                <td>${data.areaSize}</td>
                <td>lat = ${data.location.lat()} lng = ${data.location.lng()}</td>
            </tr>`;
    };
}
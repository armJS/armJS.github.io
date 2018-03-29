const MAP_MODE = {
    ADD_ROW: 'ADD_ROW',
    UPDATE_ROW: 'UPDATE_ROW'
};

function Map() {
    let map;
    let drawingManager;
    let selectedShape;
    let infowindow;
    let place;
    let addressInput;
    let $confirmBtn = $("#confirmBtn");
    let MODE = MAP_MODE.ADD_ROW;
    let updateRowIndex;


    let initMap = (initialData) => {
            let center = initialData ? {lat: initialData.location.lat(), lng: initialData.location.lng()} : {
                lat: 40.177200,
                lng: 44.503490
            };

            map = new google.maps.Map(document.getElementById('map'), {
                center: center,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 14,
                disableDefaultUI: true,
                zoomControl: true
            });

            if (initialData) {
                let polygon = new google.maps.Polygon({
                    paths: initialData.shapePaths
                });
                polygon.setMap(map);
                selectedShape = polygon;
            } else {
                MODE = MAP_MODE.ADD_ROW;
            }
        }
    ;


    let initDrawingManager = () => {
        drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [''] // hide drawing tools
            },

            polygonOptions: {
                strokeWeight: 2,
                fillOpacity: 0.45,
                editable: true
            }
        });
        disableDrawingMode();

        drawingManager.setMap(map);
    };


    let initAdressAutocomplete = () => {
        addressInput = document.getElementById('address-input');
        let autocomplete = new google.maps.places.Autocomplete(addressInput);
        autocomplete.bindTo('bounds', map);

        autocomplete.addListener('place_changed', () => {
            deleteSelectedShape();
            place = autocomplete.getPlace();
            if (place.geometry) {
                map.setCenter(place.geometry.location);
                map.setZoom(16);
                enableDrawingMode();
            } else {
                disableDrawingMode();
            }
        });
    };

    let showInfoWindow = (area) => {
        let content = `<div id="infowindow-content">
           <span>Area = ${Math.trunc(area)} m<sup>2</sup></span>
        </div>`;

        infowindow = new google.maps.InfoWindow({
            content,
            position: selectedShape.getPolygonBounds().getCenter(),
        });

        infowindow.open(map);
    };

    let hideInfoWindow = () => {
        if (infowindow) {
            infowindow.close();
        }
    };

    let calculateArea = () => {
        let area = google.maps.geometry.spherical.computeArea(selectedShape.getPath());
        showInfoWindow(area);
    };


    let clearSelection = () => {
        if (selectedShape) {
            selectedShape.setEditable(false);
            selectedShape = null;
        }
    };

    let setSelection = (shape) => {
        clearSelection();
        selectedShape = shape;
        shape.setEditable(false);
        google.maps.event.addListener(shape.getPath(), 'set_at', calculateArea);
        google.maps.event.addListener(shape.getPath(), 'insert_at', calculateArea);
    };


    let deleteSelectedShape = () => {
        if (selectedShape) {
            selectedShape.setMap(null);
        }

        hideInfoWindow();
        enableDrawingMode();
        $confirmBtn.prop('disabled', true);
    };

    let disableDrawingMode = () => {
        drawingManager.setDrawingMode(null);

    };

    let enableDrawingMode = () => {
        drawingManager.setDrawingMode("polygon");
    };

    let onOverlaycomplete = (e) => {
        if (e.type === google.maps.drawing.OverlayType.POLYGON) {
            disableDrawingMode();

            let newShape = e.overlay;
            newShape.type = e.type;
            google.maps.event.addListener(newShape, 'click', () => {
                setSelection(newShape);
            });
            setSelection(newShape);
            calculateArea();
            $confirmBtn.prop('disabled', false);
        }
    };

    let initListeners = () => {
        google.maps.event.addListener(drawingManager, 'overlaycomplete', onOverlaycomplete);
        google.maps.event.addDomListener(document.getElementById('resetBtn'), 'click', deleteSelectedShape);
        $('#confirmBtn').on('click', onConfirm);
    };

    let onConfirm = () => {
        $confirmBtn.prop('disabled', true);
        let area = google.maps.geometry.spherical.computeArea(selectedShape.getPath());

        let data = {
            address: place.formatted_address,
            areaSize: Math.trunc(area),
            location: place.geometry.location,
            shapePaths: selectedShape.getPath().b.map((p) => {
                return {lat: p.lat(), lng: p.lng()};
            })
        };

        if (MODE === MAP_MODE.ADD_ROW) {
            locTable.addRow(data);
        } else if (MODE === MAP_MODE.UPDATE_ROW) {
            locTable.updateRow(data, updateRowIndex);
        } else {
            throw new Error("Unexpected map mode");
        }
        closeModal();
    };

    this.initialize = (shapePaths) => {
        initMap(shapePaths);
        initDrawingManager();
        initListeners();
        initAdressAutocomplete();
    };

    this.updateUserSelection = ({shapePaths, address, location}, rowIndex) => {
        MODE = MAP_MODE.UPDATE_ROW;
        updateRowIndex = rowIndex;
        this.initialize({shapePaths, location});
        let area = google.maps.geometry.spherical.computeArea(selectedShape.getPath());
        showInfoWindow(area);
        addressInput.value = address;
        openModal();
    };

    this.destroy = () => {
        [map, drawingManager, selectedShape, place, infowindow, updateRowIndex].forEach((prop) => {
            prop = null;
            addressInput.value = '';
        });

        $('#confirmBtn').off();
        $("#map").empty();
    };
}


google.maps.Polygon.prototype.getPolygonBounds = function () {
    let bounds = new google.maps.LatLngBounds();
    this.getPath().forEach(function (element) {
        bounds.extend(element);
    });
    return bounds;
};
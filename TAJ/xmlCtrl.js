//APP CONFIG
var app = angular.module("ochreCTRL", []);

app.controller("xmlCtrl", ['$scope', 'orderByFilter', function($scope, orderBy) {

    $scope.propertyName = 'Name';
    $scope.reverse = true;
    $scope.rows = orderBy($scope.rows, $scope.propertyName, $scope.reverse);

    $scope.sortBy = function(propertyName) {
        $scope.reverse = (propertyName !== null && $scope.propertyName === propertyName)
        ? !$scope.reverse : false;
        $scope.propertyName = propertyName;
        $scope.rows = orderBy($scope.rows, $scope.propertyName, $scope.reverse);
    };

    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else {// code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.onload = function() {
        var xmlDoc = new DOMParser().parseFromString(xmlhttp.responseText,'text/xml');
        console.log(xmlDoc);
        showResult(xmlDoc);
    }

    //DATA CALL TO API; determine uuid from drop down menu option and plug it into a constructed URL with which to GET the data

    var menuOptionUUID = window.location.search.split("=")[1]
    if (menuOptionUUID == undefined) {
        // Prime it with Test Season for testing ... [Real Season X is e8037c67-b257-474b-ae79-3325fb96e911]
//        menuOptionUUID = "74401abb-f458-4455-9fea-14f4760cddc8"
        menuOptionUUID = "e8037c67-b257-474b-ae79-3325fb96e911"
    }
    console.log(menuOptionUUID)

    var url = "https://ochre.lib.uchicago.edu/ochre?uuid="+menuOptionUUID+"&xsl=none"

    xmlhttp.open("GET",url, false);

    xmlhttp.send();

    //CONSTRUCTOR AND FUNCTIONS

    function Row(uuid, Name = "", objectType = "", material = "", inscribed = "",  description = "") {
        this.uuid = uuid
        this.Name = Name
        this.objectType = objectType
        this.material = material
        this.inscribed = inscribed
        this.description = description
    }

    function showResult(xmlDoc) {
        addTitle(xmlDoc);
        addSubtitle(xmlDoc);

        var items = xmlDoc.getElementsByTagName("items")[0]

        var sUnits = items.childNodes
        $scope.rows = []

        for (var i = 0; i < sUnits.length; i++) {
            row = createRow(sUnits[i])
            $scope.rows.push(row);
        }
    }

    function addTitle(xmlDoc) {
        var project = xmlDoc.getElementsByTagName("project")[0];
        var title = project.getElementsByTagName("label")[0].innerHTML;
        var docTitle = document.getElementById("title");
        docTitle.append(title);
    }

    function addSubtitle(xmlDoc) {
       var setNode = xmlDoc.getElementsByTagName("set")[0];
       var subTitle = setNode.getElementsByTagName("description")[0].innerHTML;
       var docSubTitle = document.getElementById("subtitle");
       docSubTitle.append(subTitle);
    }

    function get_sUnits(xmlDoc) {
        var spatialUnits = xmlDoc.getElementsByTagName("spatialUnit");
        var sUnits = []

        console.log(spatialUnits)

        for (var i = 0; i < spatialUnits.length; i++) {
            if (spatialUnits[i].getAttribute('n') == null) {
                sUnits.push(spatialUnits[i])
            }
        }
        return sUnits;
    }

    function createRow(sUnit) {
        var uuid = sUnit.attributes["uuid"].value
        row = new Row(uuid)
        row.Name        = getName(sUnit)
        row.objectType  = getPropVal(sUnit, "7ed72a30-14a2-df6f-a2c9-76295cdb4bdb")
        row.material    = getPropVal(sUnit, "9ef98572-7a17-fe11-3c90-fe4f0a66fa78")
        row.inscribed   = getPropVal(sUnit, "c18fce17-aab6-10f5-53d0-b1394fbd3a19")
        row.description = getDescription(sUnit)
        return row;
    }

    function getName(sUnit) {
        var Name = sUnit.getElementsByTagName("identification")[0]
        return Name.getElementsByTagName("label")[0].innerHTML
    }

    function getDescription(sUnit) {
        var desc = sUnit.getElementsByTagName("description")[0]
        if (desc == undefined) {
            return ""
        } else {
            return desc.innerHTML
        }
    }

    function getPropVal(sUnit, givnUUID) {
        var xmlProperties = sUnit.getElementsByTagName("properties")[0]
        if (xmlProperties == undefined) {
            return ""
        }
        var xmlPropertyElem = xmlProperties.querySelectorAll('property[uuid="' + givnUUID + '"]')[0]
        if (xmlPropertyElem == undefined) {
            return ""
        } 
        var str = xmlPropertyElem.getElementsByTagName("value")[0].innerHTML;
        if (str.includes("&lt;unassigned&gt;")) {
            return str.replace("&lt;unassigned&gt;", "<unassigned>")
        } else {
            return str
        }
    }

    function getKTU(sUnit) {
        if (sUnit.getElementsByTagName("associated_alias")[0]) {
            return sUnit.getElementsByTagName("associated_alias")[0].innerHTML
        } else {
            return ""
        }
    }

    function getAssocUUID(sUnit) {
        if (sUnit.getElementsByTagName("associated_uuid")[0]) {
            return sUnit.getElementsByTagName("associated_uuid")[0].innerHTML
        } else {
            return ""
        }
    }

    function getTextDescription(sUnit) {
        if (sUnit.getElementsByTagName("associated_desc")[0]) {
            return sUnit.getElementsByTagName("associated_desc")[0].innerHTML
        } else {
            return ""
        }
    }

}]);

//APP SERVICE
app.service('OCHREService', function() {
    var sUnits = [];

    function sUnit(uuid, Name = "", objectType = "", material = "", inscribed = "", description = "") {
      this.uuid = uuid
      this.Name = Name //spatialUnits
      this.objectType = objectType
      this.material = material
      this.inscribed = inscribed
      this.description = description
    }

    var add_sUnit = function(uuid, Name, objectType, material, inscribed, description) {
      sUnit = new sUnit(uuid, Name, objectType, material, inscribed, description)
      sUnits.push(sUnit);
    };

    var get_sUnits = function() {
      return sUnits;
    };

    return {
        add_sUnit: add_sUnit,
        get_sUnits: get_sUnits
    };

});

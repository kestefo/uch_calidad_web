sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
        onGetFormatDateAbap: function (date) {
			if (date && date !== "") {
				var y = date.getUTCFullYear(),
					m = date.getUTCMonth() + 1,
					d = date.getUTCDate();

				m = m < 10 ? "0" + m : m;
				d = d < 10 ? "0" + d : d;

				return y.toString() + "-" + m.toString() + "-" + d.toString() + "T00:00:00";
			} else {
				return "";
			}
		},
        formatInteger: function (num) {
			if (num) {
				var x = parseInt(num);
				x = isNaN(x) ? '0' : x;
				return x.toString();
			}
		},
        onGetFormatDate: function (date) {
			if (date && date !== "") {
				var y = date.getUTCFullYear(),
					m = date.getUTCMonth() + 1,
					d = date.getUTCDate();

				m = m < 10 ? "0" + m : m;
				d = d < 10 ? "0" + d : d;

				return d.toString() + "/" + m.toString() + "/" + y.toString();
			} else {
				return "";
			}
		},
        currencyFormat: function (value) {
            try {
                if (value) {
                    if(typeof(value) === 'string'){
                        var sNumberReplace = value.replaceAll(",", "");
                        var iNumber = parseFloat(sNumberReplace);
                        return iNumber.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
                    }else if(typeof(value) === 'number'){
                        var iNumber = parseFloat(value);
                        return iNumber.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
                    }
                } else {
                    return "0.00";
                }
            }
            catch (ex) {
                return "0.00";
            }
		},
		formatHour: function (oDate) {
			var aDate = oDate.toLocaleString().split(" ")[1].split(":");
			var sValue="";
			sValue= this.completeZero(aDate[0]) +":" +this.completeZero(aDate[1]) +":" + this.completeZero(aDate[2]);
			return sValue;
		},
		formatDate: function (oDate) {
		//	var aDate = oDate.toLocaleDateString().split(" ")[0].split("/");
			var aDate = [];
			aDate[2]=String(oDate.getDate());
			aDate[1]=String(oDate.getMonth()+1);
			aDate[0]=String(oDate.getFullYear());
			var sValue="";
		//	aDate = aDate.reverse();
			sValue= this.completeZero(aDate[0]) +"-"+ this.completeZero(aDate[1]) +"-"+ this.completeZero(aDate[2]);
			return sValue;
		},
		completeZero:function(sValue){
			if(sValue.length === 1){
				sValue = "0" + sValue;
			}
			return sValue;
		},
		formatHourForSap:function(sTime){
			var aValue = [];
			var sValue = "";
			if(sTime !== null && sTime !== ""){
				aValue = sTime.split(":");
				sValue = "PT"+aValue[0]+"H"+aValue[1]+"M"+aValue[2]+"S";
			}else{
				sValue = "PT00H00M00S";
			}
			return sValue;
		},
		formatDateForSap:function(sDate){
			var sValue="";
			if(sDate !== null && sDate !== ""){
				sValue = sDate + "T00:00:00";
			}else{
				sValue=null;
			}
			return sValue;
		},
		minDate:function(sDate){
			var oDateInitial = new Date(sDate);
			var oDateFinal	 = new Date(oDateInitial.getFullYear(),oDateInitial.getMonth(),oDateInitial.getDate()+1);
			return oDateFinal;
		}

	};
});
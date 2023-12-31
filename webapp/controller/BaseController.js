sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ndc/BarcodeScanner",
	"../services/ServiceOdata",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"../model/models",
	"sap/ui/model/Filter",
	"../model/formatter",
	"sap/ui/export/Spreadsheet",
	"../constantes",
	"../services/Services",
	'../util/util',
	"../util/utilUI"
], function (Controller, History, UIComponent, MessageBox, MessageToast, Fragment, BarcodeScanner, ServiceOdata, BusyIndicator, JSONModel,
	models, Filter, Formatter, Spreadsheet, constantes, Services, util, utilUI) {
	"use strict";
	var that;
	var sMessage = "";
	return Controller.extend("solicitarcitapr.controller.BaseController", {
		formatter: Formatter,
		local: window.location.href.indexOf('launchpad') == -1 ? true : false,
		userSet: "liderdeproyecto1@omniasolution.com",
		igv: 1.18,
		sinigv: 0.82,
		getUserLoged: function () {
			var user = "";
			if (this.isEmpty(sap.ushell.Container)) {
				user = this.userSet;
			} else {
				if (this.isEmpty(sap.ushell.Container.getService("UserInfo").getUser().getEmail())) {
					user = this.userSet;
				} else {
					user = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
				}
			}
			return user;
		},
		validateUser: function () {
			that = this;
			var oModel = new sap.ui.model.json.JSONModel();
			/* Assign the model to the view */
			this.getView().setModel(oModel);
			/* Load the data */

			oModel.loadData("/services/userapi/attributes");
			// oModel.loadData("/getUserInfo/currentUser");
			/* Add a completion handler to log the json and any errors*/
			return new Promise(function (resolve, reject) {
				oModel.attachRequestCompleted(function onCompleted(oEvent) {
					console.log("--------------------------:---------------------------");
					console.log(oEvent);
					console.log(oModel);
					if (oEvent.getParameter("success")) {
						resolve(oModel.getData());
					} else {
						var msg = oEvent.getParameter("errorObject").textStatus;
						if (msg) {
							reject(msg);
							this.setData("status", msg);
						} else {
							reject("Unknown error retrieving user info");
							this.setData("status", "Unknown error retrieving user info");
						}

					}
				});
			});

		},
		_onPressHome: function () {
			that = this;
			MessageBox.warning(this.getI18nText("textbtnHome"), {
				actions: [this.getI18nText("acceptText"), this.getI18nText("cancelText")],
				emphasizedAction: MessageBox.Action.OK,
				onClose: function (sAction) {
					if (sAction === that.getI18nText("acceptText")) {
						var aplicacion = "#";
						var accion = "";
						if (!that.isEmpty(sap.ushell)) {
							var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
							oCrossAppNavigator.toExternal({
								target: {
									semanticObject: aplicacion,
									action: accion
								}
							});
						} else {
							that.oRouter.navTo("RouteLogin");
						}
					}
				}
			});
		},
		isEmpty: function (inputStr) {
			var flag;
			flag = false;
			if (inputStr === '') {
				flag = true;
			}
			if (inputStr === null) {
				flag = true;
			}
			if (inputStr === undefined) {
				flag = true;
			}
			if (inputStr == null) {
				flag = true;
			}

			return flag;
		},
		validateInternet: function () {
			var bValidate;
			bValidate = false;
			if (!window.navigator.onLine) {
				bValidate = true;
				MessageToast.show(this.getI18nText("warningInternet"));
			}
			return bValidate;
		},
		showErrorMessage: function (sError, sDetail) {
			var sDetail2 = String(sDetail);
			return MessageBox.error(sError, {
				title: "Error",
				details: sDetail2,
				styleClass: "sapUiSizeCompact",
				contentWidth: "100px"
			});
		},
		downloadFileCordova2: function (fileToSave, fileName) {
			saveFile(dirEntry, blob, fileName);
		},
		downloadFileCordova: function (fileToSave, fileName) {
			writeFile(fileToSave);

			function writeFile() {
				console.log("request file system");
				window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemRetrieved, onFileSystemFail);
			}

			function onFileSystemRetrieved(fileSystem) {
				console.log("file system retrieved");
				fileSystem.root.getFile(fileName, {
					create: true
				}, onFileEntryRetrieved, onFileSystemFail);
			}

			function onFileEntryRetrieved(fileEntry) {
				console.log("file entry retrieved");
				fileEntry.createWriter(gotFileWriter, onFileSystemFail);
			}

			function gotFileWriter(writer) {
				console.log("write to file");

				writer.onwrite = function (evt) {
					alert('done');
				}
				writer.write(fileToSave);

				window.open(fileName, '_blank');
			}

			function onFileSystemFail(error) {
				console.log(error.code);
				alert(error.code)
			}
		},
		getBlobFromFile: function (sFile) {
			var contentType = "",
				base64_marker = "";
			var sliceSize = 512,
				base64Index = 0;
			var byteCharacters,
				byteArrays = [],
				blob;
			contentType = sFile.substring(5, sFile.indexOf(";base64,"));

			base64_marker = "data:" + contentType + ";base64,";
			base64Index = base64_marker.length;
			contentType = contentType || "";
			byteCharacters = window.atob(sFile.substring(base64Index)); //method which converts base64 to binary
			byteArrays = [];
			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);
				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}
			blob = new Blob(byteArrays, {
				type: contentType
			});

			return blob;
		},
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("RouteBusqueda");
			}
		},
		getI18nText: function (sText) {
			return this.oView.getModel("i18n") === undefined ? false : this.oView.getModel("i18n").getResourceBundle().getText(sText);
		},
		getResourceBundle: function () {
			return this.oView.getModel("i18n").getResourceBundle();
		},
		getModel: function (sModel) {
			return this.oView.getModel(sModel);
		},
		_byId: function (sName) {
			var cmp = this.byId(sName);
			if (!cmp) {
				cmp = sap.ui.getCore().byId(sName);
			}
			return cmp;
		},
		getMessageBox: function (sType, sMessage) {
			return MessageBox[sType](sMessage);
		},
		getMessageBox1: function (sType, sMessage, sParameter) {
			return MessageBox[sType](sMessage, sParameter);
		},
		getMessageBoxFlex: function (sType, sMessage, _this, aMessage, sAction, sRoute, sAction2) {
			that = _this;
			return MessageBox[sType](sMessage, {
				actions: sAction === "" ? [sAction2] : [sAction, sAction2],
				onClose: function (oAction) {
					if (oAction === sAction && sRoute === "ErrorUpdate") {
						that.createMessageLog(aMessage, that);
					}
					if (oAction === sAction && sRoute === "InformationTreat") {
						var oJson = {
							NoticeNumber: that._notification,
							Flag: "",
							SystemStatus: "",
							UserStatus: ""
						};
						that.updateStateNotific("Treat", oJson, that);
					}
					if (oAction === sAction && sRoute === "InformationPostpone") {
						var oJson = {
							NoticeNumber: that._notification,
							Flag: "",
							SystemStatus: "",
							UserStatus: ""
						};
						that.updateStateNotific("Postpone", oJson, that);
					}
					if (oAction === sAction && sRoute === "InformationClose") {
						var oJson = {
							NoticeNumber: that._notification,
							RefDate: aMessage.RefDate,
							RefTime: aMessage.RefTime,
							Flag: "",
							SystemStatus: "",
							UserStatus: ""
						};
						//	that.updateStateNotific("Postpone", oJson,that);
					}
					if (oAction === sAction && sRoute === "ErrorTakePhoto") {
						that._onTakePhoto();
					}
					if (oAction === sAction2 && sRoute === "SuccessUpdate") {
						var sIdNotification = that._notification;
						that.getNotificationDetail(sIdNotification);
						//	that.oRouter.navTo("RouteBusqueda");
					}
					if (oAction === sAction && sRoute === "WarningCancel") {
						var oData = that.getModel("backup").getData();
						that.getModel("createAd").setData(JSON.parse(JSON.stringify(oData)));
						//	that.getView().setModel(models.modelEquipTechLocat(), "notification");
					}
					if (oAction === sAction2 && sRoute === "SuccesRegister") {
						var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
						oCrossAppNavigator.toExternal({
							target: {
								semanticObject: "#"
							}
						});
					}
					if (oAction === sAction && sRoute === "ErrorUpload") {
						BusyIndicator.show();
						ServiceOdata.oFTP("create", "/HeaderFileSet", that.aCreateFile, "", "1", that).then(function (resolve) {
							BusyIndicator.hide();
						}, function (error) {
							BusyIndicator.hide();
							that.getMessageBoxFlex("error", that.getI18nText("errorFTP"), that, "", that.getI18nText("yes"),
								"ErrorUpload", that.getI18nText("no"));
						});
					}
					if (oAction === sAction && sRoute === "ErrorUploadSharepoint") {
						that._saveDocuments(that.aCreateFile); //Method -> CreateNotification.controller.js
					}
				}
			});
		},
		createMessageLog: function (aMessage, _this) {
			that = _this;
			aMessage.forEach(function (oItem) {
				switch (oItem.MessageType) {
				case "E":
					oItem.MessageType = "Error";
					break;
				case "W":
					oItem.MessageType = "Warning";
					break;
				case "I":
					oItem.MessageType = "Information";
					break;
				case "C":
					oItem.MessageType = "Confirm";
					break;
				default:
				}
			});
			var oMessageTemplate = new sap.m.MessageItem({
				type: '{MessageType}',
				title: '{MessageText}',
			});

			var oModel = new JSONModel();
			oModel.setData(aMessage);

			var oBackButton = new sap.m.Button({
				icon: sap.ui.core.IconPool.getIconURI("nav-back"),
				visible: false,
				press: function () {
					that.oMessageView.navigateBack();
					this.setVisible(false);
				}
			});

			this.oMessageView = new sap.m.MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "/",
					template: oMessageTemplate
				}
			});

			this.oMessageView.setModel(oModel);

			this.oDialog = new sap.m.Dialog({
				resizable: true,
				content: this.oMessageView,
				state: 'Error',
				beginButton: new sap.m.Button({
					press: function () {
						this.getParent().close();
					},
					text: "Cerrar"
				}),
				customHeader: new sap.m.Bar({
					contentMiddle: [
						new sap.m.Text({
							text: "Error"
						})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "300px",
				contentWidth: "500px",
				verticalScrolling: false
			});
			this.oMessageView.navigateBack();
			this.oDialog.open();
		},
		getScanner: function (oEvent, controller, oBarcode) {
			that = controller;
			var sPath;
			if (!that._oScanDialog) {
				that._oScanDialog = new sap.m.Dialog({
					title: "Scan barcode",
					contentWidth: "640px",
					contentHeight: "480px",
					horizontalScrolling: false,
					verticalScrolling: false,
					stretchOnPhone: true,
					content: [
						new sap.ui.core.HTML({
							content: "<div id='barcode'> <video id='barcodevideo'   autoplay></video>	<canvas id='barcodecanvasg' ></canvas></div><canvas id='barcodecanvas' ></canvas><div id='result'></div>"
						})
					],
					endButton: new sap.m.Button({
						text: "Cancelar",
						press: function (oEvent) {
							that._oScanDialog.close();
						}.bind(that)
					}),
					afterOpen: function () {

						oBarcode.config.start = 0.0;
						oBarcode.config.end = 1.0;
						oBarcode.config.video = '#barcodevideo';
						oBarcode.config.canvas = '#barcodecanvas';
						oBarcode.config.canvasg = '#barcodecanvasg';

						oBarcode.setHandler(function (oBarcode) {
							that.getView().byId("equipment").setValue(oBarcode);
							that._oScanDialog.close();
							return new Promise(function (resolve, reject) {
								sPath = this.oModel.createKey("/Equipment", {
									Equipment: oData.EquipOrTechLocat
								});
								this.oModel.read(sPath, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject();
										that.getMessageBox("error", that.getI18nText("error"));
										$.oLog.push({
											error: error,
											date: new Date()
										});
									}
								});
							});
						});
						oBarcode.init();
					}.bind(that)
				});

				that.getView().addDependent(that._oScanDialog);
			}
			//	that.iniciarCamara();
			that._oScanDialog.open();
		},
		getDaysBefore: function (date, days) {
			var _24HoursInMilliseconds = 86400000;
			var daysAgo = new Date(date.getTime() + days * _24HoursInMilliseconds);
			daysAgo.setHours(0);
			daysAgo.setMinutes(0);
			daysAgo.setSeconds(0);
			return daysAgo;
		},
		handleMessageToast: function (message) {
			MessageToast.show(message);
		},
		setTextField: function (ofield, valueItem) {
			this._byId(ofield).setText(valueItem);
		},
		setFragment: function (sDialogName, sFragmentId, sNameFragment, that) {
			try {
				var sControllerRoot = "";
				sControllerRoot = this.getView()._controllerName.split(".")[0];
				if (!that[sDialogName]) {
					that[sDialogName] = sap.ui.xmlfragment(sFragmentId, sControllerRoot + ".view.dialogs." + sNameFragment,
						that);
					that.getView().addDependent(that[sDialogName]);
				}
				that[sDialogName].open();
			} catch (error) {
				that.getMessageBox("error", that.getI18nText("error"));
				$.oLog.push({
					error: error,
					date: new Date()
				});
			}
		},
		_treefy: function (arr, sPropertyPrincipal, sPropertyPatern, sType) {
			var _cleanTree = function (tree) {
				for (var i = 0, len = tree.length; i < len; i++) {
					delete tree[i]["__metadata"];
					if (tree[i].nodes.length === 0) {
						delete tree[i].nodes;
					} else {
						_cleanTree(tree[i]["nodes"]);
					}
				}
			};

			var tree = [],
				mappedArr = {},
				arrElem,
				mappedElem;

			// First map the nodes of the array to an object -> create a hash table.
			for (var i = 0, len = arr.length; i < len; i++) {
				arrElem = arr[i];
				mappedArr[arrElem[sPropertyPrincipal]] = arrElem;
				mappedArr[arrElem[sPropertyPrincipal]]["nodes"] = [];
			}

			for (var id in mappedArr) {
				if (mappedArr.hasOwnProperty(id)) {
					mappedElem = mappedArr[id];
					if (!mappedElem.Flag) {
						mappedElem.ref = "sap-icon://functional-location";
					} else {
						mappedElem.ref = "sap-icon://machine";
					}
					// If the element is not at the root level, add it to its parent array of children.
					if (mappedElem[sPropertyPrincipal] && mappedElem[sPropertyPatern] !== "") {
						mappedArr[mappedElem[sPropertyPatern]]["nodes"].push(mappedElem);
					}
					// If the element is at the root level, add it to first level elements array.
					else {
						tree.push(mappedElem);
					}
				}
			}
			_cleanTree(tree);
			return tree;
		},
		_onCloseDialog: function (oEvent) {
			oEvent.destroy();
		},
		formatInteger: function (num) {
			if (num) {
				var x = parseInt(num);
				x = isNaN(x) ? '0' : x;
				return x.toString();
			}
		},
		reverseStringForParameter: function (str, variable) {
			var splitString = str.split(variable);
			var reverseArray = splitString.reverse();
			var joinArray = reverseArray.join(variable);
			return joinArray;
		},
		replaceNotAll: function(value){
			var sReplace = 0;
			if(!this.isEmpty(value)){
				sReplace = value.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",","");
			}
			return sReplace;
		},
		currencyFormat: function (value) {
			if (value) {
				var sNumberReplace = value.replaceAll(",", "");
				var iNumber = parseFloat(sNumberReplace);
				return iNumber.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
			} else {
				return "0.00";
			}
		},
		currencyFormatTreeDig: function (value) {
			if (value) {
				var sNumberReplace = value.replaceAll(",", "");
				var iNumber = parseFloat(sNumberReplace);
				return iNumber.toFixed(3).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
			} else {
				return "0.000";
			}
		},
		currencyFormatIGV: function (value) {
			if (value) {
				var sNumberReplace = value.replaceAll(",", "");
				var iNumber = parseFloat(sNumberReplace) * this.igv;
				return iNumber.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
			} else {
				return "0.00";
			}
		},
		currencyFormatIGVTreeDig: function (value) {
			if (value) {
				var sNumberReplace = value.replaceAll(",", "");
				var iNumber = parseFloat(sNumberReplace) * this.igv;
				return iNumber.toFixed(3).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
			} else {
				return "0.000";
			}
		},
		formatMay: function (value) {
			if (value) {
				return value.toUpperCase();
			} else {
				return "";
			}
		},
		onValidateChange: function (oEvent) {
			var kSelected = oEvent.getSource().getSelectedKey();
			var sSelected = oEvent.getSource().getValue();
			if (kSelected !== '') {
				oEvent.getSource().setValue(sSelected);
			} else {
				if (oEvent.getSource().getValue()) {
					this.getMessageBox("error", this.getI18nText("sErrorSelect"));
				}
				oEvent.getSource().setValue("");
			}
		},
		onValidateChangeFilterPromotion: function (oEvent) {
			var kSelected = oEvent.getSource().getSelectedKey();
			var sSelected = oEvent.getSource().getValue();

			var oTable = this.byId("tbPromociones");
			var aFilter = [];

			if (kSelected !== '') {
				oEvent.getSource().setValue(sSelected);
				aFilter.push(new Filter("Numpro", 'Contains', kSelected));
			} else {
				if (oEvent.getSource().getValue()) {
					this.getMessageBox("error", this.getI18nText("sErrorSelect"));
				}
				oEvent.getSource().setValue("");
			}

			oTable.getBinding("items").filter(aFilter);
		},
		onValidateChangeFilterPromotion1: function (oEvent) {
			var kSelected = oEvent.getSource().getSelectedKey();
			var sSelected = oEvent.getSource().getValue();

			var oTable = this.byId("tbPromociones");
			var aFilter = [];

			if (kSelected !== '') {
				oEvent.getSource().setValue(sSelected);
				aFilter.push(new Filter("Numpro", 'Contains', kSelected));
			} else {
				if (oEvent.getSource().getValue()) {
					this.getMessageBox("error", this.getI18nText("sErrorSelect"));
				}
				oEvent.getSource().setValue("");
			}

			oTable.getBinding("items").filter(aFilter);
		},
		changeFormatIntegerString: function (oEvent) {
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d]/g;
			var x = values.replace(/[^\d]/g, '');

			if (values.match(regex)) {
				var x = values;
			} else {
				var x = '';
			}
			var x = parseInt(values);
			var sValueUsed = isNaN(x) ? 0 : x;

			oSource.setValue(sValueUsed.toString());
		},
		changeFormatIntegerToDigitsString: function (oEvent) {
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d]/g;
			var x = values.replace(/[^\d]/g, '');

			if (values.match(regex)) {
				var x = values;
			} else {
				var x = '';
			}
			var x = parseInt(values);
			var sValueUsed = isNaN(x) ? 0 : x;

			oSource.setValue(that.currencyFormat(sValueUsed.toString()));
		},
		liveChangeFormatInteger: function (oEvent) {
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d]/g;
			var x = values.replace(/[^\d]/g, '');

			if (values.match(regex)) {
				var x = values;
			} else {
				var x = values.substring(0, values.length - 1);
			}
			var x = parseInt(values);
			var sValueUsed = isNaN(x) ? '0' : x;

			oSource.setValue(sValueUsed);
		},
		liveChangeFormatFloat: function (oEvent) {
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d]/g;
			var x = values.replace(/[^\d]/g, '');

			if (values.match(regex)) {
				var x = values;
			} else {
				var x = '';
			}
			var x = parseFloat(values);
			var sValueUsed = isNaN(x) ? '0.00' : values;

			oSource.setValue(sValueUsed);
		},
		goNavListItem: function (oEvent) {
			var oSource = oEvent.getSource();
			var sCustom = oSource.data("custom");
			switch (sCustom) {
			case "":
				break;
			default:
				this.getView().byId("SplitContainter").to(this.createId(sCustom));
				break;
			}
		},
		_onPressClose: function (oEvent) {
			var oSource = oEvent.getSource();
			var sCustom = oSource.data("custom");
			switch (sCustom) {
				case "PackingOC":
					this._onClearComponentDetailPacking(oSource.getParent().getContent());
					this._onClearDataDetailPacking();
					oSource.getParent().close();
					break;
				case "DetailClient":
					this._onClearComponentDetailClient();
					this._onClearDataDetailClient();
					oSource.getParent().close();
					break;
				default:
					oSource.getParent().close();
			}
		},
		_onClearDataDetailPacking: function(){
			this.getModel("oModel").setProperty("/oEmbalajeEntregaconOC", []);
			this.getModel("oModel").setProperty("/oEmbalajeItemsconOC", []);
			
			this.getModel("oModel").setProperty("/DataMaterialesSeleccionadosInit", []);
		},
		_onClearComponentDetailPacking: function(oComponent){
			that._byId("tbOrderMaterial").clearSelection(true);
			oComponent.forEach(function(value){
				value.clearSelection(true);
			});
		},
		_onClearComponentDetailClient: function () {
			this._byId("frgIdDetailCliente--slDirecciones").setSelectedKey("");
			this._byId("frgIdDetailCliente--rbgComprobante").setSelectedIndex(0);
			this._byId("frgIdDetailCliente--inOrdenCompra").setValue("");
			this._byId("frgIdDetailCliente--tardenCompra").setValue("");
		},
		_onClearDataDetailClient: function () {
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/sNumPedido", "");
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/sStatus", "");
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oFlete", []);
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oSelectedCliente", {});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oMaterialSelectEan", {});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oMaterialSelectMasive", {
				titulo: "",
				oDataCargadaPrev: [],
				oDataCargadaMost: []
			});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/Spots", {
				items: [{}]
			});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oPromotions", {
				oComponent: {},
				sCantBoni: "",
				sCantProm: "",
				oPromotion: [],
				oTablaPrimerMoment: [],
				oPromotionDetail: [],
				oPromotionPadre: [],
				oPromotionSelect: [],
				sPromotionSelect: ""
			});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oSelectedLineaCredito", {});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oMaterial", []);
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/objects", {});
		},
		goNavConTo: function (sFragmentId, sNavId, sPageId) {
			// Fragment.byId(sFragmentId, "btnIdNavDialog").setVisible(true);
			var oNavCon = Fragment.byId(sFragmentId, sNavId);
			var oDetailPage = Fragment.byId(sFragmentId, sPageId);
			oNavCon.to(oDetailPage);
		},
		_groupByKey: function (array, groups, valueKey) {
			var map = new Map;
			groups = [].concat(groups);
			return array.reduce((r, o) => {
				groups.reduce((m, k, i, {
					length
				}) => {
					var child;
					if (m.has(o[k])) return m.get(o[k]);
					if (i + 1 === length) {
						child = Object.assign(...groups.map(k => ({
							[k]: o[k]
						})), {
							[valueKey]: 0
						});
						r.push(child);
					} else {
						child = new Map;
					}
					m.set(o[k], child);
					return child;
				}, map)[valueKey] += +o[valueKey];
				return r;
			}, [])
		},
		_groupBy: function (array, param) {
			return array.reduce(function (groups, item) {
				const val = item[param]
				groups[val] = groups[val] || []
				groups[val].push(item)
				return groups
			}, {});
		},
		zfill: function (number, width) {
			var numberOutput = Math.abs(number); /* Valor absoluto del número */
			var length = number.toString().length; /* Largo del número */
			var zero = "0"; /* String de cero */

			if (width <= length) {
				if (number < 0) {
					return ("-" + numberOutput.toString());
				} else {
					return numberOutput.toString();
				}
			} else {
				if (number < 0) {
					return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
				} else {
					return ((zero.repeat(width - length)) + numberOutput.toString());
				}
			}
		},

		onInvoiceDateChange: function (oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue();
			var booleanFormatDate = this.formatValidateDate(sValue);
			if (!booleanFormatDate) {
				this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
				oSource.setValue("");
				return;
			}

			var booleanDate = this.ValidateDate(sValue);
			if (!booleanDate) {
				this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
				oSource.setValue("");
				return;
			}

			var dateReverseToString = this.reverseStringForParameter(sValue, "/");
			var booleanValidateDate = Date.parse(dateReverseToString);

			if (isNaN(booleanValidateDate)) {
				this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
				oSource.setValue("");
				return;
			}

			oSource.setValue(sValue);
		},
		ValidateFormatDate: function (sValue) {
			var booleanFormatDate = this.formatValidateDate(sValue);
			if (!booleanFormatDate) {
				return false;
			}

			var booleanDate = this.ValidateDate(sValue);
			if (!booleanDate) {
				return false;
			}

			var dateReverseToString = this.reverseStringForParameter(sValue, "/");
			var booleanValidateDate = Date.parse(dateReverseToString);

			if (isNaN(booleanValidateDate)) {
				return false;
			}

			return true;
		},
		formatValidateDate: function (campo) {
			var RegExPattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
			if ((campo.match(RegExPattern)) && (campo != '')) {
				return true;
			} else {
				return false;
			}
		},
		ValidateDate: function (fecha) {
			var fechaf = fecha.split("/");
			var day = fechaf[0];
			var month = fechaf[1];
			var year = fechaf[2];
			var date = new Date(year, month, '0');
			if ((day - 0) > (date.getDate() - 0)) {
				return false;
			}
			return true;
		},

		xmlToJson: function (xml) {
			function parse(node, j) {
				var nodeName = node.nodeName.replace(/^.+:/, '').toLowerCase();
				var cur = null;
				var text = $(node).contents().filter(function (x) {
					return this.nodeType === 3;
				});
				if (text[0] && text[0].nodeValue.trim()) {
					cur = text[0].nodeValue;
				} else {
					cur = {};
					$.each(node.attributes, function () {
						if (this.name.indexOf('xmlns:') !== 0) {
							cur[this.name.replace(/^.+:/, '')] = this.value;
						}
					});
					$.each(node.children, function () {
						parse(this, cur);
					});
				}

				j[nodeName] = cur;
			}

			var roots = $(xml);
			var root = roots[roots.length - 1];
			var json = {};
			parse(root, json);
			console.log(json);
		},
		addZero :function (i) {
		    if (i < 10) {
		        i = "0" + i;
		    }
		    return i;
		},
		formatosFilterDate:function(sValue,sValue2){
			var nuevo;
			if(sValue==null){
			}else{
				var fecha=sValue.split(".")[2]+ "-" +sValue.split(".")[1]+ "-" +sValue.split(".")[0];
				var fechatotal = fecha + " " + sValue2
				return new Date(fechatotal);
			}
		},
		getFormatPuntInYYYYMMDD: function (e) {
			var d = new Date();
			var t = parseInt(e.split(".")[0]);
			var n = parseInt(e.split(".")[1]);
			var r = d.getFullYear();
			if (t < 10) {
				t = "0" + t
			}
			if (n < 10) {
				n = "0" + n
			}
			var o = r + "/" + n + "/" + t;
			return o
		},
		getYYYYMMDD: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) {
				t = "0" + t
			}
			if (n < 10) {
				n = "0" + n
			}
			var o = r + "/" + n + "/" + t;
			return o
		},
		getYYYYMMDDGUION: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) {
				t = "0" + t
			}
			if (n < 10) {
				n = "0" + n
			}
			var o = r + "-" + n + "-" + t;
			return o
		},
		formatDateAbapInDateGuion: function (e) {
			var FechaSap  =(e.replace("/Date(","")).replace(")/","");
			var Fecha = new Date(FechaSap*1);
			Fecha.setHours(Fecha.getHours() + 24);
			
			var t = Fecha.getDate();
			var n = Fecha.getMonth() + 1;
			var r = Fecha.getFullYear();
			if (t < 10) {
				t = "0" + t
			}
			if (n < 10) {
				n = "0" + n
			}
			var o = r + "-" + n + "-" + t;
			return o
		},
		getYYYYMMDDHHMMSS: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) {
				t = "0" + t
			}
			if (n < 10) {
				n = "0" + n
			}
			var o = r + "-" + n + "-" + t;
			var i = e.getHours();
			var u = e.getMinutes();
			var a = e.getSeconds();
			o = o + " " + this.getStrZero(i, 2) + ":" + this.getStrZero(u, 2) + ":" + this.getStrZero(a, 2);
			return o
		},
		getFechaNotNull: function (e) {
			var t = e;
			if (e === "" || e === undefined || e === null) {
				t = undefined
			}
			return t
		},
		formatosFechasHoras:function(sValue){
			var nuevo;
			var sValue = sValue.toString();
			if(sValue.length == 1){
				nuevo = "0"+sValue
			}else{
				nuevo = sValue
			}
			var fecha = nuevo + ":00"
			return fecha;
		},
		formatDayDateHana: function (e) {
			if (e) {
				var split = e.split("T");
				var date = split[0].replaceAll("-", "/");
				var fechaf = this.reverseStringForParameter(date, "/");
				return fechaf;
			}
		},
		formatDDMMYYYYAbap: function (e) {
			if (e) {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd/MM/yyyy"
				});
				var fecha = new Date(e.substr(0, 4) + "/" + e.substr(4, 2) + "/" + e.substr(6, 2));
				var fechaf = dateFormat.format(fecha);
				return fechaf;
			}
		},
		formatYYYYMMDDAbap: function (e) {
			if (e) {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "yyyy/MM/dd"
				});
				var fecha = new Date(e.substr(0, 4) + "/" + e.substr(4, 2) + "/" + e.substr(6, 2));
				var fechaf = dateFormat.format(fecha);
				return fechaf;
			}
		},
		formatHHMMSSAbap: function (e) {
			if (e) {
				// var sHour = e.substr(0,2) + ":" + e.substr(2,2) + ":" +e.substr(4,2);
				var sHourf = e.substr(0, 2) + ":" + e.substr(2, 2) + ":" + e.substr(4, 2);
				// var sHour = e.substr(0,2);
				// var sMinute = e.substr(2,2);
				// var sSecond = e.substr(4,2);
				// var ampm = parseInt(sHour) >= 12 ? 'pm' : 'am';
				// sHour = sHour % 12;
				// sHour = sHour ? sHour : 12; 
				// var sHourf = sHour + sMinute + sSecond + ampm;
				return sHourf;
			}
		},
		
		formatYYYYMMDDNotDayAbapStringDate: function (e) {
			if (this.isEmpty(e)) {
				return "";
			} else {
				var fecha = new Date(parseInt(e.split("(")[1].split(")")[0]));
				fecha.setHours(fecha.getHours());
				var fechaOC = this.getYYYYMMDD(fecha);
				return fechaOC;
			}
		},
		
		formatYYYYMMDDAbapStringDate: function (e) {
			if (this.isEmpty(e)) {
				return "";
			} else {
				var fecha = new Date(parseInt(e.split("(")[1].split(")")[0]));
				fecha.setHours(fecha.getHours() + 24);
				var fechaOC = this.getYYYYMMDD(fecha);
				return fechaOC;
			}
		},

		convertformatDateTotalAbapInDateTotal: function (sValueDate, sValueHour) {
			if (sValueDate != null && sValueDate != "") {
				var hour = "";
				if (sValueHour != null && sValueHour != "") {
					hour = this.convertformatHourAbapInHour(sValueHour);
				}
				var fecha = "";
				if (hour) {
					fecha = new Date(sValueDate.substr(0, 4) + "/" + sValueDate.substr(4, 2) + "/" + sValueDate.substr(6, 2) + " " + hour);
				} else {
					fecha = new Date(sValueDate.substr(0, 4) + "/" + sValueDate.substr(4, 2) + "/" + sValueDate.substr(6, 2));
				}
				return fecha;
			} else {
				return sValue;
			}
		},
		convertformatDateAbapInDate: function (sValue) {
			if (sValue != null && sValue != "") {
				var fecha = new Date(sValue.substr(0, 4) + "/" + sValue.substr(4, 2) + "/" + sValue.substr(6, 2));
				return fecha;
			} else {
				return sValue;
			}
		},
		convertformatHourAbapInHour: function (sValue) {
			if (sValue != null && sValue != "") {
				var hour = sValue.substr(0, 2) + ":" + sValue.substr(2, 2) + ":" + sValue.substr(4, 2);
				return hour;
			} else {
				return sValue;
			}
		},
		convertformatDateInAbap: function (sValue) {
			if (sValue != null && sValue != "") {
				var t = (sValue.getDate()).toString();
				var n = (sValue.getMonth() + 1).toString();
				var r = (sValue.getFullYear()).toString();
				if (t < 10) {
					t = "0" + t
				}
				if (n < 10) {
					n = "0" + n
				}
				var o = r + n + t;
				return o;
			} else {
				return sValue;
			}
		},
		reformatDateString: function (s) {
			var b = s.split(/\D/);
			return b.reverse().join('/');
		},
		formatDayRayDateSl: function (value) {
			if (value) {
				var date = value.replaceAll("-", "/");
				return date;
			} else {
				return "";
			}
		},
		formatDaySlDateRay: function (value) {
			if (value) {
				var date = value.replaceAll("/", "-");
				return date;
			} else {
				return "";
			}
		},
		_onChangeDateDesde: function (oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue()
			if (!this.isEmpty(sValue)) {
				var sFechaInicio = "";
				var bFechaInicio = "";

				sFechaInicio = sValue.trim();

				var booleanValidateFirst = this.ValidateFormatDate(sFechaInicio);
				if (!booleanValidateFirst) {
					this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
					oSource.setValue("");
					this._byId("dpDateFilterHasta").setValue("");
					this._byId("dpDateFilterHasta").setEnabled(true);
					this._byId("dpDateFilterHasta").setEnabled(true);
					return;
				}

				oSource.setValue(sValue);
				this._byId("dpDateFilterHasta").setValue("");
				this._byId("dpDateFilterHasta").setEnabled(true);
			} else {
				oSource.setValue("");
				this._byId("dpDateFilterHasta").setValue("");
				this._byId("dpDateFilterHasta").setEnabled(true);
			}
		},
		_onChangeDateHasta: function (oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue()
			if (!this.isEmpty(sValue)) {
				var sFechaInicio = "";
				var bFechaInicio = "";

				sFechaInicio = sValue.trim();

				var booleanValidateFirst = this.ValidateFormatDate(sFechaInicio);
				if (!booleanValidateFirst) {
					this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
					oSource.setValue("");
					return;
				}

				oSource.setValue(sValue);
				this._byId("dpDateFilterHasta").setEnabled(true);
			} else {
				oSource.setValue("");
			}
		},
		_onNavigateDateHasta: function (oEvent) {
			var oSource = oEvent.getSource();
			var sValueDesde = this._byId("dpDateFilterDesde").getValue();
			var sValueDesdeSplit = sValueDesde.split("/");
			var year = parseInt(sValueDesdeSplit[2]);
			var mount = parseInt(sValueDesdeSplit[1]);
			var day = parseInt(sValueDesdeSplit[0]);
			oSource.setMinDate(new Date(year, mount - 1, day));
		},
		onColorForState: function (value) {
			var sReturn;
			if (this.isEmpty(value)) {
				sReturn = "None";
			} else {
				switch (value) {
				case "N":
					sReturn = "None";
					break;
				case "S":
					sReturn = "Success";
					break;
				case "E":
					sReturn = "Error";
					break;
				case "W":
					sReturn = "Warning";
					break;
				case "I":
					sReturn = "Information";
					break;
				case "C":
					sReturn = "Confirm";
					break;
				default:
					sReturn = "None";
					break;
				}
			}
			return sReturn;
		},
		fnExportarExcel: function (oData1, oData2, oData3, sAuthor) {
			var that = this;
			var jsonDataTotal = oData1;
			var jsonDataMaster = oData2;
			var jsonDataHija = oData3;

			var jsonDataTableExcel = [];
			if (jsonDataTotal.length != 0) {
				for (var i = 0; i < jsonDataTotal.length; i++) {
					jsonDataTableExcel.push(jsonDataTotal[i]);
				}
			}
			if (jsonDataMaster.length != 0) {
				for (var i = 0; i < jsonDataMaster.length; i++) {
					jsonDataTableExcel.push(jsonDataMaster[i]);
				}
			} else if (jsonDataHija.length != 0) {
				for (var j = 0; j < jsonDataHija.length; j++) {
					jsonDataTableExcel.push(jsonDataHija[j]);
				}
			}

			if (jsonDataTableExcel.length < 1) {
				this.getMessageBox("error", this.getI18nText("errorNoDataExport"));
				return;
			}

			var aCols, oSettings;

			aCols = this.createColumnConfig();
			var dDate = new Date();
			var sGetTime = dDate.getTime().toString();
			var sTitleExcel = this.getI18nText("sTitleExport") + '-' + sGetTime + '.xlsx';
			var sTitleDocument = ""
			if (this.isEmpty(sAuthor)) {
				sTitleDocument = this.getI18nText("Token");
			} else {
				sTitleDocument = this.getI18nText("Token") + "-" + sAuthor;
			}

			oSettings = {
				workbook: {
					context: {
						title: sTitleDocument,
						modifiedBy: this.getI18nText("author")
					},
					columns: aCols
				},
				dataSource: jsonDataTableExcel,
				fileName: sTitleExcel
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},
		createColumnConfig: function () {
			return [
				// {
				// 	label: this.getI18nText("titleExportColEAN"),
				// 	property: 'Ean11',
				// 	width: '20',
				// 	type: 'String'
				// }, 
				{
					label: this.getI18nText("titleExportColMat"),
					property: 'Matnr',
					width: '20',
					type: 'String'
				}, {
					label: this.getI18nText("titleExportColCantidad"),
					property: 'cantidad',
					width: '15'
				},
				// {
				// 	label: this.getI18nText("titleExportColPrecio"),
				// 	property: 'Kbetr',
				// 	width: '15'
				// }
			];
		},
		fnLiveChangeInputsNotEmptyEmail: function (oEvent) { //solo para inputs
			const re =
				/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			var value = oEvent.getSource().getValue();

			re.test(value.toLowerCase());

			if (value == "" || value == undefined) {
				oEvent.getSource().setValueState("Error");
				oEvent.getSource().setValueStateText(this.getI18nText("textCampoVacio"));
			} else {
				if (!re.test(value.toLowerCase())) {
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(this.getI18nText("textCorreoNoValido"));
				} else {
					oEvent.getSource().setValueState("Success");
				}
			}
		},
		validateInputs: function (id, value, parameter) {
			if (this.getView().byId(id).getValueState() == "None") {

				if (value == "" || value == undefined) {
					utilUI.onMessageErrorDialogPress2("Campo vacio " + parameter);
					this.getView().byId(id).setValueState("Error");
					this.getView().byId(id).setValueStateText("Campo Vacio");
					return true;
				} else {
					this.getView().byId(id).setValueState("Success");
					return false;
				}

			} else if (this.getView().byId(id).getValueState() == "Error") {
				utilUI.onMessageErrorDialogPress2("Campo incorrecto " + parameter);
				this.getView().byId(id).setValueState("Error");
				return true;
			} else if (this.getView().byId(id).getValueState() == "Success") {
				return false;
			}
		},

		//onMethodsGetStandard
		getRuc: function () {
			var sRuc = "";
			var oData = {};
			oData = this.getModel("oModelUser").getData();
			sRuc = oData.Resources[0]["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"].attributes[0].value;
			return sRuc;
		},
		getProveedor: function () {
			var sProveedor = "";
			var oData = {};
			oData = this.getModel("oModelUser").getData();
			sProveedor = oData.oDataAditional[0].Lifnr;
			return sProveedor;
		},

		getDataHana: function () {
			try {
				that = this;
				return new Promise(function (resolve, reject) {
					var oFiltro = {
						"oResults": {
							"MODULO": "MM",
							"APLICATIVO": "SOLICITAR_CITA",
							"sProv":that.getModel("oModelUser").getData().oDataAditional[0].Lifnr
						}
					};
					Services.consultarHana(that, oFiltro, function (result) {
						util.response.validateAjaxGetHana(result, {
							success: function (oData, message) {
								resolve(oData);
							},
							error: function (message) {
								reject(message);
							}
						});
					});

				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		getDataMaestro: function (oCodigoTable) {
			try {
				that = this;
				return new Promise(function (resolve, reject) {
					// var oCodigoTable = ["T_ERP_STATUS", "T_ERP_AREA", "T_ERP_LUMP_TYPE", "T_ERP_UNIDADES", "T_ERP_MOTIVE",
					// 	"T_ERP_COND", "T_ERP_SOC", "T_ERP_DEST"
					// ];
					var oFiltro = [];
					oCodigoTable.forEach(function (codigo) {
						oFiltro.push(new Filter("CodigoTabla", "EQ", codigo));
					})
					Services.getoDataVGenericaCampo(that, oFiltro, function (result) {
						util.response.validateAjaxGetHanaMaestro(result, {
							success: function (oData, message) {
								resolve(oData);
							},
							error: function (message) {
								reject(message);
							}
						});
					});
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		getERPStatus: function () {
			try {
				return new Promise(function (resolve, reject) {
					var respuestaService = {
						iCode: 1,
						c: "suc",
						u: constantes.services.getERPStatus,
						m: "Exito HTTP - GET",
						data: models.JsonGetERPStatus().d.results
					};
					util.response.validateAjaxGetERPNotMessage(respuestaService, {
						success: function (oData, message) {
							resolve(oData);
						},
						error: function (message) {
							reject(message);
						}
					});
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		getERPArea: function () {
			try {
				return new Promise(function (resolve, reject) {
					var respuestaService = {
						iCode: 1,
						c: "suc",
						u: constantes.services.getERPArea,
						m: "Exito HTTP - GET",
						data: models.JsonGetERPArea().d.results
					};
					util.response.validateAjaxGetERPNotMessage(respuestaService, {
						success: function (oData, message) {
							resolve(oData);
						},
						error: function (message) {
							reject(message);
						}
					});
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		getERPLumpType: function () {
			try {
				return new Promise(function (resolve, reject) {
					var respuestaService = {
						iCode: 1,
						c: "suc",
						u: constantes.services.getERPLumpType,
						m: "Exito HTTP - GET",
						data: models.JsonGetERPLumpType().d.results
					};
					util.response.validateAjaxGetERPNotMessage(respuestaService, {
						success: function (oData, message) {
							resolve(oData);
						},
						error: function (message) {
							reject(message);
						}
					});
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		getERPMeasurementUnits: function () {
			try {
				return new Promise(function (resolve, reject) {
					var respuestaService = {
						iCode: 1,
						c: "suc",
						u: constantes.services.getERPMeasurementUnits,
						m: "Exito HTTP - GET",
						data: models.JsonGetERPMeasurementUnits().d.results
					};
					util.response.validateAjaxGetERPNotMessage(respuestaService, {
						success: function (oData, message) {
							resolve(oData);
						},
						error: function (message) {
							reject(message);
						}
					});
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		//PARA LOS DECIMALES 15/06/2023
		fnreemLetrasCant: function (oEvent) {
			var Objeto = oEvent.getSource();
			var val = Objeto.getValue();
			val = val.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "");
			val = val.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
			val = parseFloat(val).toFixed(2);
			val = val.toString();
			// val.indexOf();
			if (val === "NaN") {
				val = "0.00";
			}

			val = parseFloat(val);

			if (isNaN(val) || val === 0) {
				val = parseFloat(0).toFixed(2);
			} else {
				val = val.toFixed(2);

				var val_parts = val.split('.'),
					regexp = /(\d+)(\d{3})/;

				while (regexp.test(val_parts[0]))
					val_parts[0] = val_parts[0].replace(regexp, '$1' + ',' + '$2');

				val = val_parts.join('.');
			}

			Objeto.setValue(val);
		},
		formatAbapDate: function (sValue) {
 			if (sValue == null) {} else {
 				var año = sValue.split(".")[2];
 				var mes = sValue.split(".")[1];
 				var dia = sValue.split(".")[0];
 				var fechaSql = año + "" + mes + "" + dia;
 				return fechaSql;
 			}
 		},
 		formatAbapHours: function (sValue) {
 			if (sValue == null) {} else {
 				var hours = sValue.split(":")[0];
 				var min = sValue.split(":")[1];
 				var seconds = sValue.split(":")[2];
 				var horaSql = "PT" + hours + "H" + min + "M" + seconds + "S";
 				return horaSql;
 			}
 		},
 		formatAbapHoursTemp: function (sValue) {
 			if (sValue == null) {

 			} else {
 				var hours = sValue.split(":")[0];
 				var min = sValue.split(":")[1];
 				var horaSql = hours + "" + min + "" + "00";
 				return horaSql;
 			}
 		},
 		formatdigitosEntregas: function (sValue) {
 			if (sValue != null && sValue != "") {
 				var integer = parseInt(sValue.toString());

 				switch (integer.toString().length) {
 				case 9:
 					integer = "0" + integer;
 					break;
 				case 10:
 					integer = integer;
 					break;
 				default:
 					integer = integer;
 					break;
 				}
 				var newDecimal = integer.toString();
 				return newDecimal;
 			} else {
 				return sValue;
 			}
 		},
 		formaterxTemp: function (value) {
			if (value) {
				var myDater = value.substr(6,2) +"."+ value.substr(4,2) +"."+ value.substr(0,4);
				return myDater;
			} else {
				return value;
			}
		},
		formatHourTemp: function (param) {
			var formatHour;
			formatHour = param.substr(0,2) + ":"+ param.substr(2,2);

			return formatHour;

		},
		formatHour2Temp: function (param) {
			var formatHour;
			var hora2an = (parseInt(param.substr(0,2))+1).toString();
			var hora2;
			if(hora2an.length === 1 ){
				hora2 = "0" + hora2an;
			}else{
				hora2=hora2an;
			}
			
			if(hora2)

			formatHour = param.substr(0,2) + ":"+ param.substr(2,2) + "-" + hora2.toString() + ":" + param.substr(2,2);

			return formatHour;

		},
		formatNoDecimal: function (sValue) {
 			if (sValue != null && sValue != "") {
 				var val;
 				sValue = parseFloat(sValue.replace(/[^0-9,.]/g, '').replace(/,/g, '')).toString();
 				val = sValue.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
 				val = parseFloat(val).toFixed(2);
 				val = val.toString();
 				// val.indexOf();
 				if (val === "NaN") {
 					val = "0.00";
 				}

 				val = parseFloat(val);

 				if (isNaN(val) || val === 0) {
 					val = parseFloat(0).toFixed(0);
 				} else {
 					val = val.toFixed(0);

 					var val_parts = val.split('.'),
 						regexp = /(\d+)(\d{3})/;

 					while (regexp.test(val_parts[0]))
 						val_parts[0] = val_parts[0].replace(regexp, '$1' + ',' + '$2');

 					val = val_parts.join('.');
 				}

 				return val;
 			} else {
 				return sValue;
 			}

 		},
		generarCita: function () {
			var oControl = this;
			var response;
			var url = "/hana/IPROVIDER_ENTREGA/CITAS/GenerarCita.xsjs";
			var aData = jQuery.ajax({
				method: 'GET',
				cache: false,
				headers: {
					"X-CSRF-Token": "Fetch"
				},
				async: false,
				url: url
			}).then(function successCallback(result, xhr, data) {
				//token = data.getResponseHeader("X-CSRF-Token");
				response = result;
			}, function errorCallback(xhr, readyState) {
				jQuery.sap.log.debug(xhr);
			});
			return response;
		},
		EstructuraInsertFechaReturn: function (arratotal, method, cita,target,validateTipoFecha) {
 			var centro;
 			var proveedor;
 			var entregasRegistradas;
 			var vbeln;
 			var arr = [];
 			var arr2 = [];
 			var arr3 = [];
 			var arr4 = [];
 			var tipoDato = "";
 			var entregasguias = "";

 			var codigoestatus = "";
 			var descestatus = "";

 			var direccion = "";
 			var correo = "";
 			var telefono = "";
 			var ModeloProyect2;
 			var estatus;
			
			var zcita_np = "";
 			if (target == "02") {
 				entregasguias = "";
 				correo = "";
 				telefono = "";
 				estatus = that.oModelGet.getProperty("/oEstado");
 				if (arratotal[0].Ordenes[0].LugEntD === "01") { //cede campoy
 					direccion = this.getModel("oModelUser").getData().oDataAditional[0].Zdireccion;
 					if (validateTipoFecha == "01") {
 						codigoestatus = estatus[4].Campo;
 						descestatus = estatus[4].DescripcionCampo;
 						zcita_np = "PROGRAMADA";
 					} else {
 						codigoestatus = estatus[1].Campo;
 						descestatus = estatus[1].DescripcionCampo;
 						zcita_np = "NO PROGRAMADA";
 					}
 				} else if (arratotal[0].Ordenes[0].LugEntD === "02") { //puesto en mina
 					direccion = this.getModel("oModelUser").getData().oDataAditional[0].Zdireccion;
 					codigoestatus = estatus[2].Campo;
 					descestatus = estatus[2].DescripcionCampo
 					zcita_np = "";
 				} else {
 					direccion = "";
 					codigoestatus = estatus[4].Campo;
 					descestatus = estatus[4].DescripcionCampo
 					zcita_np = "";
 				}

 			}

 			for (var i = 0; i < arratotal.length; i++) {
 				entregasRegistradas = 0
 				var split = arratotal[i].FechaDisponibles.FECHAS.split(".")
 				for (var l = 0; l < arratotal[i].Ordenes.length; l++) {
 					var obj = {};
 					var entrega;
 					if (target == "02") {
 						proveedor = arratotal[i].Ordenes[l].Lifnr;
 						entrega = arratotal[i].Ordenes[l].Vbeln.toString();
 						entregasRegistradas = arratotal[i].Ordenes[l].Enviar.toString();
 						centro = arratotal[i].Ordenes[l].Centro;
 						tipoDato = arratotal[i].Ordenes[l].codtipoData;
 						obj = {
 							"CENTRO": centro,
 							"PROVEEDOR": proveedor,
 							"ENTREGAS_REGISTRADAS": entregasRegistradas,
 							"FECHA": split[2] + "-" + split[1] + "-" + split[0],
 							"HORA": arratotal[i].FechaDisponibles.HORARIOS + ":00"
 						}
 						arr2.push(obj)
 					}
 					var objhana = {};
 					if (target == "02") {
 						for (var j = 0; j < entregasguias.length; j++) {
 							if (arratotal[i].Ordenes[l].DescripcionGeneralEntrega.toString() == entregasguias[j].DescripcionGeneralEntrega.toString()) {
 								arratotal[i].Ordenes[l].Zbolnr = entregasguias[j].Zbolnr;
 							}
 						}
 						objhana = {
 							"IDCITA": cita,
 							"DNI": "",
 							"DNI2": "",
 							"DNI3": "",
 							"DNI4": "",
 							"PLACA": "",
 							"PLACA2": "",
 							"PLACA3": "",
 							"PLACA4": "",
 							"CANTIDAD_ENTREGAS": arratotal[i].Ordenes.length,
 							"CITAN": zcita_np,
 							"CORREO": correo,
 							"DIRECCION": direccion,
 							"TELEFONO": telefono,
 							"ENTREGA": entrega,
 							"NUMERO_GUIA": "",
 							"ESTATUS_USUARIO": codigoestatus,
 							"DESCRIPCION_ESTATUS_USUARIO": descestatus,
 							"FECHACITA": split[2] + "-" + split[1] + "-" + split[0],
 							"HORACITA": arratotal[i].FechaDisponibles.HORARIOS + ":00"
 						}
 						if (arratotal[i].Ordenes[l].codtipoData == "02") {
 							if (arratotal[i].Ordenes[l].LugEntD == "01" || arratotal[i].Ordenes[l].LugEntD == "02") {
 								objhana.DIRECCION = arratotal[i].Ordenes[l].direccionModificacion;
 							}
 						}
 					}
 					arr4.push(objhana)
 				}
 				
 				for (var k = 0; k < arratotal[i].Ordenes.length; k++) {
 					var cita
 					vbeln = arratotal[i].Ordenes[k].Vbeln.toString()

 					var objSap = {};
 					if (target == "02") {
 						objSap = {
 							"Vbeln": parseInt(vbeln),
 							"Lfdat": this.formatAbapDate(arratotal[i].FechaDisponibles.FECHAS),
 							"Lfuhr": this.formatAbapHoursTemp(arratotal[i].FechaDisponibles.HORARIOS),
 						}
 						arr.push(objSap)

 					}

 					var objDelete = {};
 					if (target == "02") {
 						var fecha = arratotal[i].FechaDisponibles.FECHAS;
 						var horario = arratotal[i].FechaDisponibles.HORARIOS + ":00";
 						var id = arratotal[i].Ordenes[k].ID_Eliminar;
 						var centro = arratotal[i].Ordenes[k].Centro;
 						var proveedor = arratotal[i].Ordenes[k].materiales[0].Lifnr;
 						objDelete = {
 							"id": id,
 							"fecha": fecha,
 							"hora": horario,
 							"centro": centro,
 							"codprov": proveedor
 						}
 					}
 					arr3.push(objDelete)
 				}
 			}

 			let arr2New = arr2.filter((valorActual, indiceActual, arreglo) => {
 				//Podríamos omitir el return y hacerlo en una línea, pero se vería menos legible
 				return arreglo.findIndex(valorDelArreglo => JSON.stringify(valorDelArreglo) === JSON.stringify(valorActual)) === indiceActual
 			});

 			if (target == "02") {
 				var objEnvioSap = {
 					"Planificar": "X",
 					"ItemSet": arr,
 					"NAVRESULT": [{
 						"Vbeln": "",
 						"Codigo": "",
 						"Mensaje": "",
 						"Type": ""
 					}]
 				};

 				var objReturn = {
 					"arr2": arr2,
 					"arr2New": arr2New,
 					"objEnvioSap": objEnvioSap,
 					"arr3": arr3,
 					"arr4": arr4,
 					"arratotal": arratotal
 				}

 				return objReturn;
 			}
 		},
 		dynamicSort: function (property) {
 			var sortOrder = 1;
 			if (property[0] === "-") {
 				sortOrder = -1;
 				property = property.substr(1);
 			}
 			return function (a, b) {
 				var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
 				return result * sortOrder;
 			}
 		},
	});
});
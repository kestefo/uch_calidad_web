sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"solicitarcitapr/controller/BaseController",
	"solicitarcitapr/model/models",
	"../services/Services",
	'../util/util',
	"../util/utilUI",
], function (Controller, BaseController, models, Services, util, utilUI) {
	"use strict";

	var that;
	return BaseController.extend("solicitarcitapr.controller.OrderNoOC", {
		onInit: function () {
			that = this;
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("TargetOrderNoOC").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
		},
		_onPressRefresh: function () {
			this.handleRouteMatched();
		},
		handleRouteMatched: function () {
			that.oModel = this.getModel("oModel");
			that.oModelGet = this.getModel("oModelGet");
			that.oModelUser = this.getModel("oModelUser");

			that.oModel.setSizeLimit(99999999);
			that.oModelGet.setSizeLimit(99999999);

			sap.ui.core.BusyIndicator.show(0);
			Promise.all([this.getDataMaestro(["T_ERP_STATUS", "T_ERP_AREA", "T_ERP_LUMP_TYPE", "T_ERP_UNIDADES", "T_ERP_MOTIVE",
				"T_ERP_COND", "T_ERP_SOC", "T_ERP_DEST"])
			]).then(async values => {
				this.fnClearComponent();
				this.fnClearData();
				//Uso de estado
				var oDataEstado = values[0].T_ERP_STATUS;
				that.oModelGet.setProperty("/oEstado", oDataEstado);
				//Uso de motivos
				var oDataMotive = values[0].T_ERP_MOTIVE;
				that.oModelGet.setProperty("/oMotivo", oDataMotive);
				//Uso de areas
				var oDataArea = values[0].T_ERP_AREA;
				that.oModelGet.setProperty("/oArea", oDataArea);
				//Uso de Tipo Bulto
				var oDataTipoBulto = values[0].T_ERP_LUMP_TYPE;
				that.oModelGet.setProperty("/oTipoBulto", oDataTipoBulto);
				//Uso de Unidad
				var oDataUnidades = values[0].T_ERP_UNIDADES;
				that.oModelGet.setProperty("/oUnidades", oDataUnidades);
				//Uso de condicion
				var oDataCondEnt = values[0].T_ERP_COND;
				var oDataSoc = values[0].T_ERP_SOC;
				var oDataDest = values[0].T_ERP_DEST;
				this._onEstructureCondEntFormat(oDataCondEnt, oDataSoc, oDataDest);

				sap.ui.core.BusyIndicator.hide(0);
			}).catch(function (oError) {
				sap.ui.core.BusyIndicator.hide(0);
			});
		},
		fnClearData: function () {
			that.oModelGet.setProperty("/oCondEnt", []);
			that.oModelGet.setProperty("/oEmpresa", []);
			that.oModelGet.setProperty("/oDestino", []);
			that.oModelGet.setProperty("/oMotivo", []);
			that.oModelGet.setProperty("/oArea", []);
			that.oModelGet.setProperty("/oTipoBulto", []);
			that.oModelGet.setProperty("/oUnidades", []);
			
			that.oModel.setProperty("/oEmbalajeEntregasinOC", []);
			that.oModel.setProperty("/oEmbalajeItemssinOC", []);
			
			this._byId("textCantEnt").setText("0");
			this._byId("inputEmail").setValue("");
			this._byId("otrosid").setValue("");
		},
		fnClearComponent: function () {
			this._byId("slCondEntSinOC").setSelectedKey("");
			this._byId("slEmpSinOC").setSelectedKey("");
			this._byId("slDestSinOC").setSelectedKey("");
			this._byId("slMotivoSinOC").setSelectedKey("");
			this._byId("slAreaSinOC").setSelectedKey("");
			
			this._byId("inputEmail").setValueState("None");
			that._byId("tableEmbalajes").clearSelection(true)
			that._byId("tableItems").clearSelection(true)
		},
		_onEstructureCondEntFormat: function (oDataCondEnt, oDataSoc, oDataDest) {
			var oResults = [];
			oDataCondEnt.forEach(function (x) {
				var jCondEnt = {
					"CodigoCondicion": x.Campo,
					"DescripcionCondicion": x.DescripcionCampo,
					"Direccion": x.Adicional1,
					"Sociedad": []
				}

				oDataSoc.forEach(function (xx) {
					if (x.Id === xx.IdPadre) {
						var jEmpresa = {
							"Id": xx.Id,
							"IdPadre": xx.IdPadre,
							"Bukrs": xx.Campo,
							"Butxt": xx.DescripcionCampo,
							"Centro": [],
						}
						
						oDataDest.forEach(function (xxx) {
							if (xx.Id === xxx.IdPadre) {
								var oAdicional2 = xxx.Adicional2.split(",");
								var sWerks = oAdicional2[0] === undefined ? "" : oAdicional2[0];
								var sNamew = oAdicional2[1] === undefined ? "" : oAdicional2[1];
								var oAdicional1 = xxx.Adicional1.split(",");
								var sLgort = oAdicional1[0] === undefined ? "" : oAdicional1[0];
								var sNamel = oAdicional1[1] === undefined ? "" : oAdicional1[1];
								var jDestino = {
									"Id": xxx.Id,
									"IdPadre": xxx.IdPadre,
									"Werks": sWerks,
									"Namew": sNamew,
									"Lgort": sLgort,
									"Namel": sNamel,
									"Xhupf": xxx.CodigoSap === null ? "" : xxx.CodigoSap,
									"Werks_f": xxx.Campo === null ? "" : xxx.Campo,
									"Namew_f": xxx.DescripcionCampo  === null ? "" : xxx.DescripcionCampo,
								}
								jEmpresa.Centro.push(jDestino)
							}
						});
						
						jCondEnt.Sociedad.push(jEmpresa)
					}
				});

				oResults.push(jCondEnt)
			});
			that.oModelGet.setProperty("/oCondEnt", oResults);
		},
		//AGREGADO ERICK
		fnSelectedCondEntregaOC: function (oEvent) {
			var keyCondEntrega = oEvent.getSource().getSelectedItem().getKey();
			var ModeloProyect = that.oModelGet;
			if (keyCondEntrega != "") {
				var data = oEvent.getSource().getSelectedItem().getBindingContext("oModelGet").getObject();
				var empresa = data.Sociedad;

				that.oModelGet.setProperty("/oEmpresa", []);
				that.oModelGet.setProperty("/oDestino", []);
				
				that._byId("slEmpSinOC").setSelectedKey("");
				that._byId("slDestSinOC").setSelectedKey("");

				that.oModelGet.setProperty("/oEmpresa", empresa);

			} else {
				that.oModelGet.setProperty("/oEmpresa", []);
				that.oModelGet.setProperty("/oDestino", []);
				
				that._byId("slEmpSinOC").setSelectedKey("");
				that._byId("slDestSinOC").setSelectedKey("");
			}
		},
		//AGREGADO ERICK
		fnSelectedDestino: function (oEvent) {
			var keyCondEntrega = oEvent.getSource().getSelectedItem().getKey();
			var ModeloProyect = that.oModelGet;
			if (keyCondEntrega != "") {
				var data = oEvent.getSource().getSelectedItem().getBindingContext("oModelGet").getObject();
				var centro = data.Centro;

				that.oModelGet.setProperty("/oDestino", []);
				that._byId("slDestSinOC").setSelectedKey("");

				that.oModelGet.setProperty("/oDestino", centro);

			} else {
				that.oModelGet.setProperty("/oDestino", []);
				that._byId("slDestSinOC").setSelectedKey("");
			}
		},
		//AGREGADO ERICK
		fnSelectionEmbalajes: function (oEvent) {
			var oView = this.getView();
			var table = oView.byId("tableEmbalajes");
			var context = oEvent.getParameter("rowContext");
			var ModeloProyect = oView.getModel("Proyect");
			var DatoAnterior = ModeloProyect.getProperty("/OneDataTreeTableEntregaSinOCEmbalaje");
			if (context === null) {
				return;
			}

			if (context != null) {
				var path = context.sPath;
				var Object = this.getView().getModel("EntregaSinOC").getProperty(path);
			}

			var oIndex = oEvent.getParameter('rowIndex');
			var Selecciones = table.getSelectedIndices();
			var selectedEntriesProvi = [];
			var selectedEntries = [];

			if (table.getSelectedIndices().length === 1) {
				ModeloProyect.setProperty("/OneDataTreeTableEntregaSinOCEmbalaje", oIndex);
				for (var i = 0; i < Selecciones.length; i++) {
					var oData = table.getContextByIndex(Selecciones[i]);
					selectedEntries.push(oData.getProperty(oData.getPath()));
				}
			} else if (table.getSelectedIndices().length === 0) {
				ModeloProyect.setProperty("/OneDataTreeTableEntregaSinOCEmbalaje", "");
			} else {
				if (DatoAnterior !== oIndex) {
					table.removeSelectionInterval(DatoAnterior, DatoAnterior);
				}
			}
		},
		fnPressAddEmbalajes: function (oEvent) {
			var obj;
			var items = [];
			var objmaxtable;
			var maximo = 0;
			var maxEmb = 0;
			if (this.getView().byId("tableEmbalajes").getBinding().getModel("/oEmbalajeEntregasinOC").getData().oEmbalajeEntregasinOC !=
				undefined) {
				items = this.getView().byId("tableEmbalajes").getBinding().getModel("/oEmbalajeEntregasinOC").getData().oEmbalajeEntregasinOC;
				for (var i = 0, len = items.length; i < len; i++) {
					if (maximo < items[i].key) {
						maximo = items[i].key;
						objmaxtable = items[i];
					}

					if (maxEmb < items[i].nEmbalaje) {
						maxEmb = items[i].nEmbalaje;
					}
				}
			}

			obj = {
				"key": maximo + 1,
				"nEmbalaje": maxEmb + 1,
				"selectedKey": "",
				"tipoEmbalaje": "",
				"desctipoEmbalaje": "",
				"descripcionContenido": "",
				"peso": "",
				"longitud": "",
				"ancho": "",
				"altura": ""
			}

			items.push(obj);
			that.oModel.setProperty("/oEmbalajeEntregaconOC", items);
		},
		fnPressDeleteEmbalajes: function () {
			var that = this;
			var oView = this.getView();
			var tablaEmbalajes = oView.byId("tableEmbalajes");
			var index = tablaEmbalajes.getSelectedIndices();
			if (tablaEmbalajes.getSelectedIndices().length == 1) {
				MessageBox.confirm(
					"¿Seguro que desea eliminar? \n Se eliminaran todos los items relacionados al embalaje \n Se actualizaran los embalajes y items", {
						actions: ["Confirmar", "Cancelar"],
						emphasizedAction: "Manage Products",
						onClose: function (sAction) {
							if (sAction == "Confirmar") {
								that.fnDeleteEmbalajes();
							}
						}
					});
			} else {
				utilUI.onMessageErrorDialogPress2("No se ha seleccionado ningun embalaje");
			}
		},
		fnDeleteEmbalajes: function () {
			var that = this;
			var oView = this.getView();

			var table = oView.byId("tableEmbalajes");
			var index = oView.byId("tableEmbalajes").getSelectedIndices()[0];

			var tableItems = oView.byId("tableItems");
			var indexItems = oView.byId("tableItems").getSelectedIndex();
			tableItems.removeSelectionInterval(indexItems, indexItems);

			var sPath = "/DataEmbalajes/" + (index).toString();
			var objTabla = oView.getModel("EntregaSinOC").getProperty("/DataEmbalajes");
			var objSelected = oView.getModel("EntregaSinOC").getProperty(sPath);

			var objectItem = oView.getModel("EntregaSinOC").getProperty("/DataItems");
			var cantidad = objectItem.length;
			var objectItemMoment = oView.getModel("EntregaSinOC").getProperty("/DataItems");
			var indiceItems = [];
			for (var i = 0; i < cantidad; i++) {
				if (objSelected.nEmbalaje == objectItem[i].nEmbalaje) {
					var indice = objectItemMoment.indexOf(objectItem[i]);
					if (indice != -1)
						indiceItems.push(indice)
				}
			}
			if (indiceItems.length > 0) {
				objectItemMoment.splice(indiceItems[0], indiceItems.length);
				oView.getModel("EntregaSinOC").setProperty("/DataItems", objectItemMoment);
			}

			var arrmoment = [];

			for (var i = 0; i < objTabla.length; i++) {
				var indice = objTabla.indexOf(objSelected);
				if (indice != -1)
					objTabla.splice(indice, 1);
			}

			var oJsonModel = new JSONModel([]);

			this.reestruccturacionTabla(objTabla, 0, "/DataEmbalajes", objectItemMoment, "/DataItems");

			table.removeSelectionInterval(index, index);

			oView.byId("cantEmbalajeEntregaSinOC").setText(objTabla.length)

			oView.getModel("EntregaSinOC").setProperty("/DataEmbalajes", objTabla);

			MessageBox.success("Eliminado Correctamente.");
		},
		fnSelectionItems: function (oEvent) {
			var oView = this.getView();
			var table = oView.byId("tableItems");
			var context = oEvent.getParameter("rowContext");
			var ModeloProyect = oView.getModel("Proyect");
			var DatoAnterior = ModeloProyect.getProperty("/OneDataTreeTableEntregaSinOCItems");

			if (context != null) {
				var path = context.sPath;
				var Object = this.getView().getModel("ItemsSinOC").getProperty(path);
			}

			var oIndex = oEvent.getParameter('rowIndex');
			var Selecciones = table.getSelectedIndices();
			var selectedEntriesProvi = [];
			var selectedEntries = [];

			if (table.getSelectedIndices().length === 1) {
				ModeloProyect.setProperty("/OneDataTreeTableEntregaSinOCItems", oIndex);
				for (var i = 0; i < Selecciones.length; i++) {
					var oData = table.getContextByIndex(Selecciones[i]);
					selectedEntries.push(oData.getProperty(oData.getPath()));
				}
			} else if (table.getSelectedIndices().length === 0) {
				ModeloProyect.setProperty("/OneDataTreeTableEntregaSinOCItems", "");
			} else {
				if (DatoAnterior !== oIndex) {
					table.removeSelectionInterval(DatoAnterior, DatoAnterior);
				}
			}
		},
		fnPressAddItems: function (oEvent) {
			var oSource = oEvent.getSource();
			var obj;
			var items = [];
			var objmaxtable;
			var maximo = 0;
			var maxitem = 0;
			var oTable = this._byId("tableEmbalajes");
			var oTableItems = this._byId("tableItems");
			var iIndex = oTable.getSelectedIndex();
			
			if (oTable.getSelectedIndices().length > 0) {
				var oSelectEmb = oTable.getContextByIndex(iIndex).getObject();
				var sPathEmb = oSource.getParent().getParent().getBinding().sPath;
				var oIndece = oTableItems.getSelectedIndices();
				if (that.oModel.getProperty("/oEmbalajeItemssinOC").length > 0) {
					items = that.oModel.getProperty("/oEmbalajeItemssinOC");
					for (var i = 0, len = items.length; i < len; i++) {
						if (maximo < items[i].key) {
							maximo = items[i].key;
							objmaxtable = items[i];
						}

						if (oSelectEmb.nEmbalaje == items[i].nEmbalaje) {
							if (maxitem < items[i].itemkey) {
								maxitem = items[i].itemkey;
							}
						}
					}
				}

				obj = {
					"key": maximo + 1,
					"nEmbalaje": oSelectEmb.nEmbalaje,
					"keyEmbalaje": oSelectEmb.key,
					"selectedKey": "",
					"itemkey": maxitem + 1,
					"descripcionMaterial": "",
					"cantidad": "",
					"unmMaterial": "",
					"descunmMaterial": "",
					"obsMaterial": ""
				}

				items.push(obj);
				that.oModel.setProperty("/oEmbalajeItemssinOC", items);
			} else {
				that.getMessageBox("error", that.getI18nText("sErrorNotSelectEmb"));
			}
		},
		fnPressDeleteItems: function () {
			var that = this;
			var oView = this.getView();
			var tablaItems = oView.byId("tableItems");
			var index = tablaItems.getSelectedIndices();
			if (tablaItems.getSelectedIndices().length == 1) {
				MessageBox.confirm("¿Seguro que desea eliminar? \n Se actualizaran los items", {
					actions: ["Confirmar", "Cancelar"],
					emphasizedAction: "Manage Products",
					onClose: function (sAction) {
						if (sAction == "Confirmar") {
							that.fnDeleteItems();
						}
					}
				});
			} else {
				utilUI.onMessageErrorDialogPress2("No se ha seleccionado ningun item");
			}
		},
		fnDeleteItems: function () {
			var that = this;
			var oView = this.getView();

			var table = oView.byId("tableItems");
			var index = oView.byId("tableItems").getSelectedIndices()[0];
			var sPath = "/DataItems/" + (index).toString();
			var objTabla = oView.getModel("EntregaSinOC").getProperty("/DataItems");
			var objSelected = oView.getModel("EntregaSinOC").getProperty(sPath);

			var arrmoment = [];

			for (var i = 0; i < objTabla.length; i++) {
				var indice = objTabla.indexOf(objSelected);
				if (indice != -1)
					objTabla.splice(indice, 1);
			}

			var oJsonModel = new JSONModel([]);

			this.reestruccturacionTabla(objTabla, 1, "/DataItems");

			table.removeSelectionInterval(index, index);

			oView.getModel("EntregaSinOC").setProperty("/DataItems", objTabla);

			MessageBox.success("Eliminado Correctamente.");
		},
		reestruccturacionTabla: function (obj, event, parameter, objItems, parameterItems) {
			var that = this;
			var oView = this.getView();

			if (event == 0) {
				var index = oView.byId("tableEmbalajes").getSelectedIndex();
				var sPath = "/DataEmbalajes/" + (index).toString();
				var objSelected = oView.getModel("EntregaSinOC").getProperty(sPath);

				var countEmb = 0;
				for (var i = 0; i < obj.length; i++) {
					obj[i].nEmbalaje = countEmb + 1;
					countEmb++;
				}
				var countItem = 0
				if (objItems.length > 0) {
					for (var i = 0; i < obj.length; i++) {
						for (var j = 0; j < objItems.length; j++) {
							if (obj[i].key == objItems[j].keyEmbalaje) {
								objItems[j].nEmbalaje = obj[i].nEmbalaje;
							}
						}
					}
					oView.getModel("EntregaSinOC").setProperty(parameterItems, objItems);
				}

				oView.getModel("EntregaSinOC").setProperty(parameter, obj);
			} else {
				var index = oView.byId("tableItems").getSelectedIndex();
				var sPath = "/DataItems/" + (index).toString();
				var objSelected = oView.getModel("EntregaSinOC").getProperty(sPath);

				var countEmb = 0;
				for (var i = 0; i < obj.length; i++) {
					if (obj[i].nEmbalaje == objSelected.nEmbalaje) {
						obj[i].itemkey = countEmb + 1;
						countEmb++;
					}
				}
				oView.getModel("EntregaSinOC").setProperty(parameter, obj);
			}

		},
		fnSelectedTipoBultoEntregaOC: function (oEvent) {
			var oSource = oEvent.getSource();
			var oSelectItem = oSource.getSelectedItem();
			var jSelectItem = oSelectItem.getBindingContext("oModelGet").getObject();
			var oRow = oSource.getParent();
			var jRow = oRow.getBindingContext("oModel").getObject();
			var arr = that.oModel.getProperty("/oEmbalajeEntregasinOC");
			for (var i = 0; i < arr.length; i++) {
				if (jRow.key == arr[i].key) {
					arr[i].desctipoEmbalaje = jSelectItem.DescripcionCampo;
				}
			}
			that.oModel.setProperty("/oEmbalajeEntregasinOC", arr);
		},
		fnSelectedUnmMaterial: function (oEvent) {
			var oSource = oEvent.getSource();
			var oSelectItem = oSource.getSelectedItem();
			var jSelectItem = oSelectItem.getBindingContext("oModelGet").getObject();
			var oRow = oSource.getParent();
			var jRow = oRow.getBindingContext("oModel").getObject();
			var arr = that.oModel.getProperty("/oEmbalajeItemssinOC");
			for (var i = 0; i < arr.length; i++) {
				if (jRow.key == arr[i].key) {
					arr[i].descunmMaterial = jSelectItem.DescripcionCampo;
				}
			}
			that.oModel.setProperty("/oEmbalajeItemssinOC", arr);
		},
		fnPressGuardarOC:function(){
			var prooveedores=that.oModelUser.getData();
			
			var cCondEnt=that._byId("slCondEntSinOC").getSelectedItem();
			if( that.isEmpty(cCondEnt) ){
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSelect")+ " "+ that.getI18nText("lbCondicionEntrega"));
				return;
			}
			var condEnt = cCondEnt.getBindingContext("oModelGet").getObject();
			
			var cEmpr=that._byId("slEmpSinOC").getSelectedItem();
			if( that.isEmpty(cEmpr) ){
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSelect")+ " "+ that.getI18nText("lbEmpresa"));
				return;
			}
			var empr = cEmpr.getBindingContext("oModelGet").getObject();
			
			var cdestino=that._byId("slDestSinOC").getSelectedItem();
			if( that.isEmpty(cdestino) ){
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSelect")+ " "+ that.getI18nText("lbDestinoFinal"));
				return;
			}
			var destino = cdestino.getBindingContext("oModelGet").getObject();
			
			var cAreaResp=that._byId("slAreaSinOC").getSelectedItem();
			if( that.isEmpty(cAreaResp) ){
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSelect")+ " "+ that.getI18nText("lbAreaSolicitante"));
				return;
			}
			var areaResp=cAreaResp.getBindingContext("oModelGet").getObject();
			
			var cMotivos=that._byId("slMotivoSinOC").getSelectedItem();
			if( that.isEmpty(cMotivos) ){
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSelect")+ " "+ that.getI18nText("lbMotivo"));
				return;
			}
			var motivos=cMotivos.getBindingContext("oModelGet").getObject();
			
			var otros="";
			if(motivos.Motivo == "X03"){
				otros=that._byId("otrosid").getValue();
				if( that.isEmpty(otros) ){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("textCampoVacio")+ " "+ that.getI18nText("lblOtros"));
					return;
				}
			}
			
			var email=that._byId("inputEmail").getValue();
			var booleanEmail = this.validateInputs("inputEmail",email,that.getI18nText("lbDestinatarioFinal") );
			if(booleanEmail){return;}
			
			var oTableEmb = that._byId("tableEmbalajes");
			var sPathEmb = oTableEmb.getBinding().sPath;
			
			var embalajes=that.oModel.getProperty(sPathEmb);
			if(embalajes.length==0){
				utilUI.onMessageErrorDialogPress2( that.getI18nText("sErrorNotEmb") );
				return;
			}
			for(var i = 0;i<embalajes.length ; i++){
				var data = embalajes[i];
				
				var tipoEmbalaje = data.tipoEmbalaje;
				if( that.isEmpty(tipoEmbalaje) ){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotSelectEmbNum")+ data.nEmbalaje +that.getI18nText("sErrorCampTipoEmb"));
					return;
				}
				
				var descripcionContenido = data.descripcionContenido;
				if(descripcionContenido == "" || /^\s+$/.test(descripcionContenido)){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotInputEmbNum")+ data.nEmbalaje + that.getI18nText("sErrorCampDesc"));
					return;
				}
				
				var peso = data.peso;
				if(peso == ""){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotInputEmbNum")+ data.nEmbalaje + that.getI18nText("sErrorCampPeso"));
					return;
				}
				
				if(parseFloat(peso)<1){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorCampCero")+ data.nEmbalaje + that.getI18nText("sErrorCampPeso") );
					return;
				}
				
				var longitud = data.longitud;
				if(longitud == ""){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotInputEmbNum")+ data.nEmbalaje + that.getI18nText("sErrorCampLong") );
					return;
				}
				
				if(parseFloat(longitud)<1){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorCampCero")+ data.nEmbalaje + that.getI18nText("sErrorCampLong"));
					return;
				}
				
				var ancho = data.ancho;
				if(ancho == ""){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotInputEmbNum")+ data.nEmbalaje +that.getI18nText("sErrorCampAncho"));
					return;
				}
				
				if(parseFloat(ancho)<1){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorCampCero")+ data.nEmbalaje +that.getI18nText("sErrorCampAncho"));
					return;
				}
				
				var altura = data.altura;
				if(altura == ""){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotInputEmbNum")+ data.nEmbalaje +that.getI18nText("sErrorCampAltura"));
					return;
				}
				
				if(parseFloat(altura)<1){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorCampCero")+ data.nEmbalaje +that.getI18nText("sErrorCampAltura"));
					return;
				}
				
			}
			
			var oTableItem = that._byId("tableItems");
			var sPathItem = oTableItem.getBinding().sPath;
			
			var items=that.oModel.getProperty(sPathItem);
			if(items.length==0 ){
				utilUI.onMessageErrorDialogPress2( that.getI18nText("sErrorNotItem") );
				return;
			}
			for(var j = 0;j<items.length ; j++){
				var data = items[j];
				
				var descripcionMaterial=data.descripcionMaterial;
				if(that.isEmpty(descripcionMaterial) || /^\s+$/.test(descripcionMaterial)){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotInputMatNum")+ data.nEmbalaje+data.itemkey+that.getI18nText("sErrorCampDescMat") );
					return;
				}
				
				var cantidad=data.cantidad;
				if(that.isEmpty(cantidad)){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotInputMatNum")+ data.nEmbalaje+data.itemkey+that.getI18nText("sErrorCampCant") );
					return;
				}
				
				if(parseFloat(cantidad) < 1){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorCampMatCero")+ data.nEmbalaje+data.itemkey+that.getI18nText("sErrorCampCant") );
					return;
				}
				
				var unmMaterial=data.unmMaterial;
				if(that.isEmpty(unmMaterial)){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotSelectMatNum")+ data.nEmbalaje+data.itemkey+that.getI18nText("sErrorCampUNMMAt") );
					return;
				};
			}
			
			for(var i = 0;i<embalajes.length ; i++){
				var booleanCorrelativo=true;
				var dataEmbalajes = embalajes[i];
				for(var j = 0;j<items.length ; j++){
					var dataItems = items[j];
					if(dataEmbalajes.nEmbalaje == dataItems.nEmbalaje){
						booleanCorrelativo = false;
					}
				}
				
				if(booleanCorrelativo){
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorGenerateItem") + dataEmbalajes.nEmbalaje);
					return;
				}
			}
			
			var oEstatus=that.oModelGet.getProperty("/oEstado");
			var estatus;
			oEstatus.forEach(function(value){
				if(value.Campo === "01"){
					estatus = value
				}
			});
			
			var undmed=that.oModelGet.getProperty("/oUnidades");
			
			utilUI.messageBox(this.getI18nText("sTextSave"), "C", function (value) {
                if (value) {
					//Estructura Cabecera
					var sum=0;
					embalajes.forEach(function(x){
						if(x.peso != "")
						//JRodriguez 13/05/2021
						var pesoRem = x.peso.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "");
						sum += parseFloat(pesoRem);
					});
					var objCabecera={
						"PROOVEDOR":prooveedores.oDataAditional[0].Lifnr, 
						"NOMBRE_PROVEEDOR": prooveedores.oDataAditional[0].Name,
						"CORREO_PROVEEDOR": prooveedores.oDataAditional[0].Smtp_addr,
						"CENTRO_DETINO_FINAL": destino.Werks_f,
						"DESCRIPCION_CENTRO_DESTINO_FINAL":destino.Namew_f,
						"SOCIEDAD": empr.Bukrs, 
						"NOMBRE_SOCIEDAD": empr.Butxt, 
						"CENTRO": destino.Werks, 
						"NOMBRE_CENTRO": destino.Namew, 
						"HU":destino.Xhupf,
						"CODIGO_CONDICION_ENTREGA": condEnt.CodigoCondicion,
						"DESCRIPCION_CONDICION_ENTREGA": condEnt.DescripcionCondicion,
						"ALMACEN": destino.Lgort, //---> buscar sol
						"NOMBRE_ALMACEN": destino.Namel, //--->buscarsol
						"CANTIDAD_EMBALAJE": embalajes.length.toString(), 
						"PESO_TOTAL_EMBALAJE": sum.toFixed(2),
						"AREA_RESPONSABLE": areaResp.DescripcionCampo,
						"MOTIVOS": motivos.Campo,
						"MOTIVOS_OTROS": otros,
						"DESCRIPCION_MOTIVOS": motivos.DescripcionCampo,
						"EMAIL_DESTINATARIO_FINAL": email,
						"NUMERO_GUIA": "", // Manda Vacio
						"ESTATUS_USUARIO": estatus.Campo,
						"DESCRIPCION_ESTATUS_USUARIO": estatus.DescripcionCampo,
						"DIRECCION":condEnt.Direccion,
						"USUARIO_CREADOR": prooveedores.Resources[0].userName,
						"USUARIO_MODIFICADOR": prooveedores.Resources[0].userName
					}
					
					//Estructura detalles
					var objDetalle=[];
					for(var i = 0;i<embalajes.length ; i++){
						var obj={};
						var dataEmbalajes = embalajes[i];
						for(var j = 0;j<items.length ; j++){
							var dataItems = items[j];
							if(dataEmbalajes.nEmbalaje == dataItems.nEmbalaje){
								var pesoG		= dataEmbalajes.peso.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "");
								var longitudG	= dataEmbalajes.longitud.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "");
								var anchoG 		= dataEmbalajes.ancho.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "");
								var alturaG		= dataEmbalajes.altura.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "");
								var cantidadG	= dataItems.cantidad.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "");
								var oFindUnd = undmed.find(item => item.Campo === dataItems.unmMaterial);
								obj={
									"ENTREGA":"",
									"NUMERO_EMBALAJE":dataEmbalajes.nEmbalaje.toString(),
									"TIPO_EMBALAJE":dataEmbalajes.tipoEmbalaje,
									"DESCRIPCION_TIPO_EMBALAJE":dataEmbalajes.desctipoEmbalaje,
									"DESCRIPCION_CONTENIDO":dataEmbalajes.descripcionContenido,
									"PESO":parseFloat(pesoG).toFixed(2),
									"LARGO":parseFloat(longitudG).toFixed(2),
									"ANCHO":parseFloat(anchoG).toFixed(2),
									"ALTURA":parseFloat(alturaG).toFixed(2),
									"ITEM":dataItems.itemkey.toString(),
									"DESCRIPCION_MATERIAL":dataItems.descripcionMaterial,
									"CANTIDAD":parseFloat(cantidadG).toFixed(2),
									"UNIDAD":dataItems.unmMaterial,
									"DESCRIPCION_UNIDAD":dataItems.descunmMaterial,
									"OBSERVACION_MATERIAL":dataItems.obsMaterial,
									"USUARIO_CREADOR": prooveedores.Resources[0].userName,
									"USUARIO_MODIFICADOR": prooveedores.Resources[0].userName,
									"UNIDAD_PESO": oFindUnd.DescripcionCampo === undefined ? "":oFindUnd.DescripcionCampo,
									"CODIGO_TIPO_MATERIAL": "03",
									"TIPO_MATERIAL": "Comun",
								}
								objDetalle.push(obj);
							}
						}
					}
					
					var total={
						"objCabecera": objCabecera,
						"objDetalle": objDetalle,
						"objEmbalaje": embalajes,
						"user": that.getRuc()
					}
					
					var obj = {
						"oResults" : total
					}
					return;
					that.RegistrarEntregaSinOC(obj);
				}
			});
		},
		RegistrarEntregaSinOC: function(obj){
			sap.ui.core.BusyIndicator.show(0);
			var oResults = obj;
			Services.RegistrarEntregaSinOC(this, oResults, function (result) {
				util.response.validateFunctionEndButton(result, {
					success: function (data, message) {
						that._onPressCancel();
					},
					error: function (message) {
						Busy.close();
					}
				});
			});
		},
		_onPressCancel: function () {
			this.fnClearComponent();
			this.fnClearData();
			that.oRouter.navTo("RouteMain");
		},
	});
});
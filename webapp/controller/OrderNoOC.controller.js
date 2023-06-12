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
        handleRouteMatched: function(){
            that.oModel = this.getModel("oModel");
            that.oModelGet = this.getModel("oModelGet");
            that.oModelUser = this.getModel("oModelUser");

            that.oModel.setSizeLimit(99999999);
            that.oModelGet.setSizeLimit(99999999);

            Promise.all([this.getERPMotivo(),this.getERPArea(),this.getERPCondicionEntrega()
            ]).then(async values => {
                //Uso de motivos
                var oDataMotive = values[0].data;
                that.oModelGet.setProperty("/oMotivo", oDataMotive);
                //Uso de areas
                var oDataArea = values[1].data;
                that.oModelGet.setProperty("/oArea", oDataArea);
                //Uso de condicionarea
                var oDataCondEnt = values[2].data;
                this._onEstructureCondEnt(oDataCondEnt);
            }).catch(function (oError) {
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        getERPMotivo: function(){
            try{
                return new Promise(function (resolve, reject) {
                    var respuestaService = {
                        iCode:1,
                        c: "suc",
                        u: "Dato Estandar",
                        m: "Exito HTTP - GET",
                        data: models.JsonGetERPMotive().d.results 
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
            }catch(oError){
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
            }
        },
        getERPArea: function(){
            try{
                return new Promise(function (resolve, reject) {
                    var respuestaService = {
                        iCode:1,
                        c: "suc",
                        u: "Dato Estandar",
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
            }catch(oError){
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
            }
        },
        getERPCondicionEntrega: function(){
            try{
                return new Promise(function (resolve, reject) {
                    var respuestaService = {
                        iCode:1,
                        c: "suc",
                        u: "Dato Estandar",
                        m: "Exito HTTP - GET",
                        data: models.JsonGetERPWarehouseCenter().d.results 
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
            }catch(oError){
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
            }
        },
        _onEstructureCondEnt: function(oData){
            var oResults = [];
            $.each(that._groupBy(oData,'CodCond'), function (x, y) {
                var jCondEnt = {
                    "CodigoCondicion": y[0].CodCond,
                    "DescripcionCondicion": y[0].DescCond,
                    "Direccion": y[0].Direccion,
                    "Sociedad": []
                }
                var oResults2 = [];
                $.each(that._groupBy(y,'Bukrs'), function (xx, yy) {
                    var jEmpresa = {
                        "Bukrs": yy[0].Bukrs,
                        "Butxt": yy[0].Butxt,
                        "Centro": yy
                    }
					
                    oResults2.push(jEmpresa);
                });

                jCondEnt.Sociedad = oResults2;

                oResults.push(jCondEnt);
            });
            that.oModelGet.setProperty("/oCondEnt", oResults);  
            console.log(oResults)
        },
		//AGREGADO ERICK
        fnSelectedCondEntregaOC:function(oEvent){
			var keyCondEntrega=oEvent.getSource().getSelectedItem().getKey();
			var ModeloProyect = that.oModelGet;
			if(keyCondEntrega != ""){
				var data=oEvent.getSource().getSelectedItem().getBindingContext("oModelGet").getObject();
				var empresa = data.Sociedad;

                that.oModelGet.setProperty("/oEmpresa", []);
                that.oModelGet.setProperty("/oDestino", []);

                that.oModelGet.setProperty("/oEmpresa", empresa);
                
                
			}else{
                that.oModelGet.setProperty("/oEmpresa", []);
                that.oModelGet.setProperty("/oDestino", []);
			}
		},
		//AGREGADO ERICK
		fnSelectedDestino:function(oEvent){
			var keyCondEntrega=oEvent.getSource().getSelectedItem().getKey();
			var ModeloProyect = that.oModelGet;
			if(keyCondEntrega != ""){
				var data=oEvent.getSource().getSelectedItem().getBindingContext("oModelGet").getObject();
				var centro = data.Centro;

                that.oModelGet.setProperty("/oDestino", []);

				that.oModelGet.setProperty("/oDestino", centro);
                
			}else{
                that.oModelGet.setProperty("/oDestino", []);
			}
		},
        //AGREGADO ERICK
        fnPressAddEmbalajes:function(oEvent){
			var obj;
			var items=[];
			var objmaxtable;
			var maximo = 0;
			var maxEmb=0;
			if(this.getView().byId("tableEmbalajes").getBinding().getModel("/oEmbalajeEntregasinOC").getData().oEmbalajeEntregasinOC != undefined){
				items= this.getView().byId("tableEmbalajes").getBinding().getModel("/oEmbalajeEntregasinOC").getData().oEmbalajeEntregasinOC;
				for(var i=0,len=items.length;i<len;i++){
					if(maximo < items[i].key){
						maximo = items[i].key;
						objmaxtable = items[i];
					}
					
					if(maxEmb < items[i].nEmbalaje){
						maxEmb = items[i].nEmbalaje;
					}
				}
			}
				
			obj={
				"key": maximo + 1,
				"nEmbalaje": maxEmb + 1,
				"selectedKey":"",
				"tipoEmbalaje": "",
				"desctipoEmbalaje": "",
				"descripcionContenido": "",
				"peso": "",
				"longitud": "",
				"ancho": "",
				"altura": ""
			}
			
			items.push(obj);
			that.oModel.setProperty("/oEmbalajeEntregasinOC", items);
			//this.getView.byId("textCantEnt")
        },
        fnSelectionEmbalajes:function(oEvent){
			var oView = this.getView();
			var table = oView.byId("tableEmbalajes");
			var context = oEvent.getParameter("rowContext");
			var ModeloProyect = oView.getModel("Proyect");
			var DatoAnterior=ModeloProyect.getProperty("/OneDataTreeTableEntregaSinOCEmbalaje");
			if(context === null){
				return ;
			}
			
			if(context != null){
				var path = context.sPath;
				var Object = this.getView().getModel("EntregaSinOC").getProperty(path);
			}
			
			var oIndex = oEvent.getParameter('rowIndex');
			var Selecciones =table.getSelectedIndices();
			var selectedEntriesProvi = [];
			var selectedEntries=[];
			
			if(table.getSelectedIndices().length ===1){
				ModeloProyect.setProperty("/OneDataTreeTableEntregaSinOCEmbalaje",oIndex);
				for(var i=0; i<Selecciones.length; i++){
					var oData = table.getContextByIndex(Selecciones[i]);
					selectedEntries.push(oData.getProperty(oData.getPath()));
				}
			}else if (table.getSelectedIndices().length ===0){
				ModeloProyect.setProperty("/OneDataTreeTableEntregaSinOCEmbalaje","");
			}else {
				if(DatoAnterior !== oIndex){
					table.removeSelectionInterval(DatoAnterior,DatoAnterior);
				}
			}
		},
		fnPressDeleteEmbalajes:function(){
			var that = this;
			var oView= this.getView();
			var tablaEmbalajes=oView.byId("tableEmbalajes");
			var index=tablaEmbalajes.getSelectedIndices();
			if(tablaEmbalajes.getSelectedIndices().length == 1){
				MessageBox.confirm("¿Seguro que desea eliminar? \n Se eliminaran todos los items relacionados al embalaje \n Se actualizaran los embalajes y items", {
					actions: ["Confirmar", "Cancelar"],
					emphasizedAction: "Manage Products",
					onClose: function (sAction) {
						if(sAction=="Confirmar"){
							that.fnDeleteEmbalajes();
						} 
					}
				});
			}else{
				utilUI.onMessageErrorDialogPress2("No se ha seleccionado ningun embalaje");
			}
		},
		fnDeleteEmbalajes:function(){
			var that = this;
			var oView=this.getView();
			
			var table = oView.byId("tableEmbalajes");
			var index = oView.byId("tableEmbalajes").getSelectedIndices()[0];
			
			var tableItems = oView.byId("tableItems");
			var indexItems = oView.byId("tableItems").getSelectedIndex();
			tableItems.removeSelectionInterval(indexItems,indexItems);
			
			var sPath="/DataEmbalajes/" + (index).toString();
			var objTabla=oView.getModel("EntregaSinOC").getProperty("/DataEmbalajes");
			var objSelected=oView.getModel("EntregaSinOC").getProperty(sPath);
			
			var objectItem=oView.getModel("EntregaSinOC").getProperty("/DataItems");
			var cantidad=objectItem.length;
			var objectItemMoment=oView.getModel("EntregaSinOC").getProperty("/DataItems");
			var indiceItems=[];
			for(var i=0;i<cantidad;i++){
				if(objSelected.nEmbalaje == objectItem[i].nEmbalaje){
					var indice = objectItemMoment.indexOf( objectItem[i] );
					if(indice != -1)
					indiceItems.push(indice)
				}
			}
			if(indiceItems.length > 0){
				objectItemMoment.splice( indiceItems[0], indiceItems.length );
				oView.getModel("EntregaSinOC").setProperty("/DataItems", objectItemMoment);
			}
			
			var arrmoment=[];
			
			for(var i=0;i<objTabla.length;i++){
				var indice = objTabla.indexOf( objSelected );
				if(indice != -1)
				objTabla.splice( indice, 1 );
			}
			
			var oJsonModel = new JSONModel([]);
			
			this.reestruccturacionTabla(objTabla,0,"/DataEmbalajes",objectItemMoment,"/DataItems");
			
			table.removeSelectionInterval(index,index);
			
			oView.byId("cantEmbalajeEntregaSinOC").setText(objTabla.length)
			
			oView.getModel("EntregaSinOC").setProperty("/DataEmbalajes", objTabla);
			
			MessageBox.success("Eliminado Correctamente.");
		},
        fnPressAddItems  :function(){
			var oView = this.getView();
			var that=this;
			var obj;
			var items=[];
			var objmaxtable;
			var maximo = 0;
			var maxitem = 0;
			
			var table = oView.byId("tableEmbalajes");
			var index = oView.byId("tableEmbalajes").getSelectedIndices();
			var sPath="/DataEmbalajes/" + (index).toString();
			var objSelected=oView.getModel("EntregaSinOC").getProperty(sPath);
			
			if(index.length > 0){
				if(oView.byId("tableItems").getBinding().getModel("/DataItems").getData().DataItems != undefined){
					items= oView.byId("tableItems").getBinding().getModel("/DataItems").getData().DataItems;
					for(var i=0,len=items.length;i<len;i++){
						if(maximo < items[i].key){
							maximo = items[i].key;
							objmaxtable = items[i];
						}
						
						if(objSelected.nEmbalaje == items[i].nEmbalaje){
							if(maxitem < items[i].itemkey){
								maxitem = items[i].itemkey;
							}
						}
					}
				}
					
				obj={
					"key":maximo+1,
					"nEmbalaje":objSelected.nEmbalaje,
					"keyEmbalaje":objSelected.key,
					"selectedKey":"",
					"itemkey":maxitem+1,
					"descripcionMaterial": "",
					"cantidad": "",
					"unmMaterial": "",
					"descunmMaterial": "",
					"obsMaterial": ""
				}
				
				items.push(obj);
				oView.getModel("EntregaSinOC").setProperty("/DataItems", items);
			}else{
				MessageBox.error("No se puede añadir items sin seleccionar un embalaje", {
					actions: ["Ok"],
					emphasizedAction: "Manage Products",
					onClose: function (sAction) {
					}
				});
			}
		},
		fnSelectionItems:function(oEvent){
			var oView = this.getView();
			var table = oView.byId("tableItems");
			var context = oEvent.getParameter("rowContext");
			var ModeloProyect = oView.getModel("Proyect");
			var DatoAnterior=ModeloProyect.getProperty("/OneDataTreeTableEntregaSinOCItems");
			
			if(context != null){
				var path = context.sPath;
				var Object = this.getView().getModel("ItemsSinOC").getProperty(path);
			}
			
			var oIndex = oEvent.getParameter('rowIndex');
			var Selecciones =table.getSelectedIndices();
			var selectedEntriesProvi = [];
			var selectedEntries=[];
			
			if(table.getSelectedIndices().length ===1){
				ModeloProyect.setProperty("/OneDataTreeTableEntregaSinOCItems",oIndex);
				for(var i=0; i<Selecciones.length; i++){
					var oData = table.getContextByIndex(Selecciones[i]);
					selectedEntries.push(oData.getProperty(oData.getPath()));
				}
			}else if (table.getSelectedIndices().length ===0){
				ModeloProyect.setProperty("/OneDataTreeTableEntregaSinOCItems","");
			}else {
				if(DatoAnterior !== oIndex){
					table.removeSelectionInterval(DatoAnterior,DatoAnterior);
				}
			}
		},
		fnPressDeleteItems:function(){
			var that = this;
			var oView=this.getView();
			var tablaItems=oView.byId("tableItems");
			var index=tablaItems.getSelectedIndices();
			if(tablaItems.getSelectedIndices().length == 1){
				MessageBox.confirm("¿Seguro que desea eliminar? \n Se actualizaran los items", {
					actions: ["Confirmar", "Cancelar"],
					emphasizedAction: "Manage Products",
					onClose: function (sAction) {
						if(sAction=="Confirmar"){
							that.fnDeleteItems();
						} 
					}
				});
			}else{
				utilUI.onMessageErrorDialogPress2("No se ha seleccionado ningun item");
			}
		},
		fnDeleteItems:function(){
			var that = this;
			var oView=this.getView();
			
			var table = oView.byId("tableItems");
			var index = oView.byId("tableItems").getSelectedIndices()[0];
			var sPath="/DataItems/" + (index).toString();
			var objTabla=oView.getModel("EntregaSinOC").getProperty("/DataItems");
			var objSelected=oView.getModel("EntregaSinOC").getProperty(sPath);
			
			var arrmoment=[];
			
			for(var i=0;i<objTabla.length;i++){
				var indice = objTabla.indexOf( objSelected );
				if(indice != -1)
				objTabla.splice( indice, 1 );
			}
			
			var oJsonModel = new JSONModel([]);
			
			this.reestruccturacionTabla(objTabla,1,"/DataItems");
			
			table.removeSelectionInterval(index,index);
			
			oView.getModel("EntregaSinOC").setProperty("/DataItems", objTabla);
			
			MessageBox.success("Eliminado Correctamente.");
		},
        reestruccturacionTabla:function(obj,event,parameter,objItems,parameterItems){
			var that = this;
			var oView=this.getView();
			
			if(event == 0){
				var index = oView.byId("tableEmbalajes").getSelectedIndex();
				var sPath="/DataEmbalajes/" + (index).toString();
				var objSelected=oView.getModel("EntregaSinOC").getProperty(sPath);
				
				var countEmb=0;  
				for(var i=0;i<obj.length;i++){
					obj[i].nEmbalaje = countEmb+1;
					countEmb++;
				}
				var countItem=0
				if(objItems.length>0){
					for(var i=0;i<obj.length;i++){
						for(var j=0;j<objItems.length;j++){
							if(obj[i].key == objItems[j].keyEmbalaje){
								objItems[j].nEmbalaje = obj[i].nEmbalaje;
							}
						}
					}
					oView.getModel("EntregaSinOC").setProperty(parameterItems, objItems);
				}
				
				oView.getModel("EntregaSinOC").setProperty(parameter, obj);
			}else{
				var index = oView.byId("tableItems").getSelectedIndex();
				var sPath="/DataItems/" + (index).toString();
				var objSelected=oView.getModel("EntregaSinOC").getProperty(sPath);
				
				var countEmb=0; 
				for(var i=0;i<obj.length;i++){
					if(obj[i].nEmbalaje == objSelected.nEmbalaje){
						obj[i].itemkey = countEmb+1;
						countEmb++;
					}
				}
				oView.getModel("EntregaSinOC").setProperty(parameter, obj);
			}
			
		},
		fnSelectedTipoBultoEntregaOC:function(oEvent){
			that=this;
			oView=this.getView();
			var tipoemb=oEvent.getSource().getSelectedItem().getBindingContext("Proyect").getObject();
			var cell=oEvent.getSource().getParent().getBindingContext("EntregaSinOC").getObject();
			var arr=oView.getModel("EntregaSinOC").getProperty("/DataEmbalajes");
			for(var i=0;i<arr.length;i++){
				if(cell.key == arr[i].key){
					arr[i].tipoEmbalaje = tipoemb.Vegr2;
					arr[i].desctipoEmbalaje = tipoemb.Bezei;
				}
			}
			oView.getModel("EntregaSinOC").setProperty("/DataEmbalajes", arr);
		},
		fnSelectedUnmMaterial:function(oEvent){
			that=this;
			oView=this.getView();
			var booleanDescripcion=false;
			var booleanKey=false;
			var boolean=false;
			var value=oEvent.getSource().getSelectedItem().getKey();
			var data = oEvent.getSource().getItems();
			
			var obj = {};
			var cell=oEvent.getSource().getParent().getBindingContext("EntregaSinOC").getObject();
			var arr=oView.getModel("EntregaSinOC").getProperty("/DataItems");
			
			for(var i = 0; i < data.length ; i++){
				if(data[i].getBindingContext("EntregaSinOC").getObject().Msehi){
					if(data[i].getKey() == value){
						obj = data[i].getBindingContext("EntregaSinOC").getObject();
						boolean =  true;
					}
				}
			}
			
			if(boolean && value != ""){
				booleanKey = true;
			}
			
			if(oEvent.getSource().getSelectedKey() == ""){
				if(booleanKey ){
					var unm=obj;
					for(var i=0;i<arr.length;i++){
						if(cell.key == arr[i].key){
							arr[i].unmMaterial = unm.Msehi;
							arr[i].descunmMaterial = unm.Msehl;                   
						}
					}
					oView.getModel("EntregaSinOC").setProperty("/DataItems", arr);
				}else{
					for(var i=0;i<arr.length;i++){
						arr[i].unmMaterial = "";
						arr[i].descunmMaterial = "";      
					}
					oView.getModel("EntregaSinOC").setProperty("/DataItems", arr);
				}
			}else{
				var unm=oEvent.getSource().getSelectedItem().getBindingContext("EntregaSinOC").getObject();
				for(var i=0;i<arr.length;i++){
					if(cell.key == arr[i].key){
						arr[i].unmMaterial = unm.Msehi;
						arr[i].descunmMaterial = unm.Msehl;                   
					}
				}
				oView.getModel("EntregaSinOC").setProperty("/DataItems", arr);
			}
			
		},
        _onPressCancel: function(){
            that.oRouter.navTo("RouteMain");
        },
    });
});
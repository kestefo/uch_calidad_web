sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "solicitarcitapr/controller/BaseController",
    "solicitarcitapr/model/models",
    "../constantes",
    "../services/Services",
	'../util/util',
	"../util/utilUI",
], function (Controller, BaseController, models, constantes, Services, util, utilUI) {
    "use strict";

    var that; 
    var iCont = 0; 
    return BaseController.extend("solicitarcitapr.controller.Main", {
        onInit: function () {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("TargetMain").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
            
            this.frgIdAddProduct = "frgIdAddProduct";
            this.frgIdShowMaterials = "frgIdShowMaterials";
            this.frgIdFechaPlan = "frgIdFechaPlan";
        },
        _onPressRefresh: function(){
            this.handleRouteMatched();
        },
        handleRouteMatched: function () {
            that.oModel = this.getModel("oModel");
            that.oModelGet = this.getModel("oModelGet");
            that.oModelUser = this.getModel("oModelUser");
            
            that.oModel.setSizeLimit(99999999);
            that.oModelGet.setSizeLimit(99999999);
			
			sap.ui.core.BusyIndicator.show(0);
            Promise.all([this.getDataMaestro(["T_ERP_STATUS", "T_ERP_AREA", "T_ERP_LUMP_TYPE", "T_ERP_UNIDADES"]),this.getDataHana()
            ]).then(async values => {
            	this.fnClearComponent();
				this.fnClearData();
				
				var oDataHana = values[1].oResults;
                //angellyn get data table 1
                var oDataPedEmb = oDataHana.OrdersToBePackaged;
                this._onEstructurePedEmb(oDataPedEmb);

                //jose get data table 1
                var oDataPedSinCita = oDataHana.WalInOrders;
                this._onEstructurePedSinCita(oDataPedSinCita);
                
                //jose get data table 2
                var oDataPedConCita = values[8].data;
                this._onEstructurePedConCita(oDataPedConCita);

				sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        fnClearData: function () {
			that.oModel.setProperty("/oEntregasConCita", []);
			that.oModel.setProperty("/oEntregasNoCita", []);
			that.oModel.setProperty("/DataPedidosEmbalar", []);
		},
		fnClearComponent: function () {
			that._byId("TreeTableBasic2").clearSelection(true);
			that._byId("TreeTableBasic").clearSelection(true);
			that._byId("TreeTable").clearSelection(true);
			
			that._byId("TreeTable").collapseAll();
			that._byId("TreeTableBasic").collapseAll();
			that._byId("TreeTableBasic2").collapseAll();
		},

        _onEstructurePedEmb: function(oData){
            var oResults = [];
			that = this,
            $.each(this._groupBy(oData,'Butxt'), function (x, y) {
                var jSociedad = {
                    "DescripcionGeneral": y[0].Butxt,
                    "SociedadCodigo": y[0].Bukrs,
                    "ArrayGeneral": []
                }

				var arrayCentro = [];
				$.each(that._groupBy(y,'Werks'), function (xx, yy) {
					var jCentro = {
						"DescripcionGeneral": yy[0].NamewD,
						"CentroCodigo": yy[0].Werks,
						"ArrayGeneral": []
					}

                    var arrayAlmacen = [];
                    $.each(that._groupBy(yy,'Lgort'), function (xxx, yyy) {
                        var jAlmacen = {
                            "AlmacenCodigo": yyy[0].Lgort,
                            "DescripcionGeneral": yyy[0].NamelD,
                            "ArrayGeneral": []
                        }

                        var arrayGroupOrden = [];
                        $.each(that._groupBy(yyy,'PstypD'), function (xxxx, yyyy) {
                            var jGroupOrden = {
                                "OrdenCodigo": yyyy[0].PstypD,
                                "DescripcionGeneral": yyyy[0].PstypD ==='0' ? that.getI18nText("ordenNormal"):that.getI18nText("ordenConsignacion"),
                                "ArrayGeneral": []
                            }

                            var arrayOrden = [];
                            $.each(that._groupBy(yyyy,'Ebeln'), function (xxxxx, yyyyy) {
								yyyyy.forEach(function(value){
									if(value.Xhupf === 0){
										value.Xhupf = true;	
									}else{
										value.Xhupf = false;	
									}
                            	});
                                var jOrdenes = {
                                    "Bedat": yyyyy[0].Bedat,
                                    "Ebeln": yyyyy[0].Ebeln,
                                    "NameTextc": yyyyy[0].NameTextc,
                                    "NamelD": yyyyy[0].NamelD,
                                    "PstypD": yyyyy[0].PstypD,
                                    "Xhupf": yyyyy[0].Xhupf,
                                    "ArrayMaterial": yyyyy
                                }
                                arrayOrden.push(jOrdenes);
                            });
                            jGroupOrden.ArrayGeneral = arrayOrden;
                            arrayGroupOrden.push(jGroupOrden);
                        });

                        jAlmacen.ArrayGeneral = arrayGroupOrden;
                        arrayAlmacen.push(jAlmacen);
                    });

                    jCentro.ArrayGeneral = arrayAlmacen;
					arrayCentro.push(jCentro);

				});

				jSociedad.ArrayGeneral = arrayCentro;
                oResults.push(jSociedad);
            });   

			this.getView().getModel("oModel").setProperty("/DataPedidosEmbalar", oResults);
			console.log(this.getView().getModel("oModel").getData());
        },
        _onEstructurePedSinCita: function(oDataPedSinCita){
            var oResults = [];
            $.each(that._groupBy(oDataPedSinCita,'Zzlfstk'), function (x, y) {
                var jEstado = {
                    "DescripcionGeneral": y[0].Zzlfstk,
                    "ArrayGeneral": y
                }

                if(y[0].Zzlfstk === "04"){
                    oResults.push(jEstado);
                }
            });

            var oResults2 = [];

            oResults.forEach(function(value){
                var oDataNew = value.ArrayGeneral;
                if(value.DescripcionGeneral === "04"){
                    $.each(that._groupBy(oDataNew,'Vbeln'), function (x, y) {
                    	if(y[0].COD != "02"){
                    		y[0].COD = "01";
                    		y[0].COD_DESC = "ERP";
                    	}
                    	
                    	
                        var jResults = {
                        	"Zzlfstk": y[0].Zzlfstk,
                        	"Werks": y[0].Werks,
                        	"Lifnr": y[0].Lifnr,
                            "Vbeln": y[0].Vbeln,
                            "Namew": y[0].Namew,
                            "Namel": y[0].Namel,
                            "Desc_cond": y[0].DescCond,
                            "Anzpk": y[0].Anzpk,
                            "Btgew": y[0].Btgew,
                            "descEstatusSinOC": "Ent. Por Generar Cita",
                            "codtipoData": y[0].COD,
                            "desctipoData": y[0].COD_DESC,
                            "direccionModificacion": y[0].DIRECCION,
                            "entprogramadas": y[0].Entprog,
                            "Lgort": y[0].Lgort,
                            "materiales": y
                        }
        
                        oResults2.push(jResults);
                    });   
                }
            });
            

            that.oModel.setProperty("/oEntregasNoCita", oResults2);
        },
        _onEstructurePedConCita: function(oDataPedConCita){
            var oResults = [];
            $.each(that._groupBy(oDataPedConCita,'Zzlfstk'), function (x, y) {
                var jEstado = {
                    "DescripcionGeneral2": y[0].Zzlfstk,
                    "ArrayGeneral2": y
                }

                if(y[0].Zzlfstk === "01" || y[0].Zzlfstk === "02" || y[0].Zzlfstk === "03" || y[0].Zzlfstk === "05" || y[0].Zzlfstk === "07"){
                    oResults.push(jEstado);
                }
            });

            var oResults2 = [];

            oResults.forEach(function(value){
                var oDataNew = value.ArrayGeneral2;
                $.each(that._groupBy(oDataNew,'Zvbeln'), function (x, y) {
                    var jResults = {
                        "ZcitaNp": y[0].ZcitaNp,
                        "Zzlfstkdesc": y[0].Zzlfstkdesc,
                        "Zcita": y[0].Zcita,
                        "Zvbeln": y[0].Zvbeln,
                        "Zgort": y[0].Zgort,
                        "Zlgobe": y[0].Zlgobe,
                        "Zbolnr": y[0].Zbolnr,
                        "ZdescCond": y[0].ZdescCond,
                        "Zlfdat": y[0].Zlfdat,
                        "Zlfuhr": y[0].Zlfuhr,
                        "Zbtgew": y[0].Zbtgew,
                        "materiales": y,
                        "materiales": y,
                    }
                    oResults2.push(jResults);
                });   
            });
            that.oModel.setProperty("/oEntregasConCita", oResults2);
        },
        _onSelectPlan: function(oEvent){
            var oSource = oEvent.getSource();
            var selectkey = oSource.getSelectedKey();

            switch(selectkey){
                case "keyTabFilterPedEmb" :
                    this._byId("btOrderNoOC").setVisible(true);
                    this._byId("btOrderOC").setVisible(true);

                    this._byId("btChangeOrder").setVisible(false);
                    this._byId("btDeleteOrder").setVisible(false);
                    this._byId("btMakeAppointment").setVisible(false);
                    this._byId("btUpdateRegister").setVisible(false);
                    this._byId("btUpdateDate").setVisible(false);
                    this._byId("btDeleteAppointment").setVisible(false);
                    break;
                case "keyTabFilterGenCit" :
                    this._byId("btMakeAppointment").setVisible(true);
                    this._byId("btChangeOrder").setVisible(true);
                    this._byId("btDeleteOrder").setVisible(true);

                    this._byId("btOrderNoOC").setVisible(false);
                    this._byId("btOrderOC").setVisible(false);
                    this._byId("btUpdateRegister").setVisible(false);
                    this._byId("btUpdateDate").setVisible(false);
                    this._byId("btDeleteAppointment").setVisible(false);

                    this._byId("btDeleteOrder").setEnabled(false);
                    this._byId("btChangeOrder").setEnabled(false);
                    break;
                case "keyTabFilterCitEnt" :
                    this._byId("btChangeOrder").setVisible(true);
                    this._byId("btDeleteOrder").setVisible(true);
                    this._byId("btUpdateRegister").setVisible(true);
                    this._byId("btUpdateDate").setVisible(true);
                    this._byId("btDeleteAppointment").setVisible(true);

                    this._byId("btMakeAppointment").setVisible(false);
                    this._byId("btOrderNoOC").setVisible(false);
                    this._byId("btOrderOC").setVisible(false);

                    this._byId("btDeleteOrder").setEnabled(false);
                    this._byId("btChangeOrder").setEnabled(false);
                    break; 
            }
        },
        _onPressShowMaterials: function(oEvent){
            var oSource = oEvent.getSource();
            var oRow = oSource.getParent();
            var oRowData = oRow.getBindingContext("oModel").getObject();
            var oMaterial = oRowData.materiales;
            this.setFragment("_dialogShowMaterials", this.frgIdShowMaterials, "ShowMaterials", this);
            that.oModel.setProperty("/oEntregasNoCitaMateriales", oMaterial);
        },
        _onPressShowMaterials2: function(oEvent){
            var oSource = oEvent.getSource();
            var oRow = oSource.getParent();
            var oRowData = oRow.getBindingContext("oModel").getObject();
            var oMaterial = oRowData.materiales;
            var oResults = [];
            oMaterial.forEach(function(value){
                var jMaterial = {
                    "EbelnD": value.Zebeln,
                    "PosnrD": value.Zvgpos,
                    "MatnrD": value.Zlfdat,
                    "MaktxD": value.Zmaktx,
                    "VemngD": value.Zvemng,
                    "VrkmeD": value.Zunmed,
                };
                oResults.push(jMaterial);
            });
            this.setFragment("_dialogShowMaterials", this.frgIdShowMaterials, "ShowMaterials", this);
            that.oModel.setProperty("/oEntregasNoCitaMateriales", oResults);
        },
        _onPressOrderNoOC: function(){
            that.oRouter.navTo("RouteOrderNoOC");
        },
        _onPressOrderOC: function(){
        	var oTable = that.byId("TreeTable");
            var oIndeces = oTable.getSelectedIndices();
            var oMaterials = [];
            oIndeces.forEach(function(value){
                var oOrdeneSelect = oTable.getContextByIndex(value).getObject();
                var oMaterialSelect = oOrdeneSelect.ArrayMaterial;
                oMaterialSelect.forEach(function(value2){
                    oMaterials.push(value2);
                })
            });
            
            if(oIndeces.length > 0){
				this.getModel("oModel").setProperty("/oDataEntregaOCPrev", oMaterials);
				that.oRouter.navTo("RouteOrderOC");
            }else{
            	utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSelectOrden"));
				return;
            }
        },
        _onPressFechaPlan: function(oEvent){
            var oSource = oEvent.getSource();
            var oRow = oSource.getParent();
            var oTable = that.byId("TreeTableBasic");
            var oIndeces = oTable.getSelectedIndices();
            if(oIndeces.length===0){
                utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
			    return;
            }else{
                this.setFragment("_dialogFechaPlan", this.frgIdFechaPlan, "FechaPlan", this);
            }
        },
    });
});

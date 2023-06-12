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
            
            that.oModel.setProperty("/", models.oDataGeneralModel());
            that.oModelGet.setProperty("/", models.oDataGeneralGetModel());

            Promise.all([this.getDataHana(),this.getERPStatus(),this.getERPArea(),this.getERPLumpType(),
                this.getERPMeasurementUnits(),
                this.getERPOrdersToBePackaged(),this.getERPWalInOrders(),this.getHanaWalInOrders(), this.getERPOrdersByAppointment(),
            ]).then(async values => {

                //angellyn get data table 1
                var oDataPedEmb = values[5].data;
                this._onEstructurePedEmb(oDataPedEmb);

                //jose get data table 1
                var oDataPedSinCita = values[6].data;
                this._onEstructurePedSinCita(oDataPedSinCita);
                
                //jose get data table 2
                var oDataPedConCita = values[8].data;
                this._onEstructurePedConCita(oDataPedConCita);

                //angelly 06/06/2023
                this._onCasoUso();

            }).catch(function (oError) {
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        getERPOrdersToBePackaged:function(){
            try{
                return new Promise(function (resolve, reject) {
                    var ruc = "";
                    ruc = that.getRuc();
                    var respuestaService = {
                        iCode:1,
                        c: "suc",
                        u: constantes.services.getERPOrdersToBePackaged+"filter=RucInput eq '" + ruc  +"'&$format=json",
                        m: "Exito HTTP - GET",
                        data: models.JsonGetERPOrdersToBePackaged().d.results 
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
        getERPWalInOrders:function(){
            try{
                return new Promise(function (resolve, reject) {
                    var sRuc = "";
                    sRuc = that.getRuc();
                    var respuestaService = {
                        iCode:1,
                        c: "suc",
                        u: constantes.services.getERPWalInOrders+"filter=IRuc eq '" + sRuc  +"'&$format=json",
                        m: "Exito HTTP - GET",
                        data: models.JsonGetERPWalInOrders().d.results 
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
        getHanaWalInOrders: function(){
            try{
                return new Promise(function (resolve, reject) {
                    util.response.validateAjaxGetHana(models.JsonGetHanaWalInOrders(), {
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
        getERPOrdersByAppointment:function(){
            try{
                return new Promise(function (resolve, reject) {
                    var sProveedor = "";
                    sProveedor = that.getProveedor();
                    var respuestaService = {
                        iCode:1,
                        c: "suc",
                        u: constantes.services.OrdersByAppointment+"filter=EstatusIni eq '01' and EstatusFin eq '07' and Provee eq '" + sProveedor  +"'&$format=json",
                        m: "Exito HTTP - GET",
                        data: models.JsonGetERPOrdersByAppointment().d.results 
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
                        var jResults = {
                            "Vbeln": y[0].Vbeln,
                            "Namew": y[0].Namew,
                            "Namel": y[0].Namel,
                            "Desc_cond": y[0].Desc_cond,
                            "Anzpk": y[0].Anzpk,
                            "Btgew": y[0].Btgew,
                            "descEstatusSinOC": "",
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
        _onPressOrderNoOC: function(){
            that.oRouter.navTo("RouteOrderNoOC");
        },
        _onPressOrderOC: function(){
            that.oRouter.navTo("RouteOrderOC");
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
        _onPressShowMaterials: function(){
            this.setFragment("_dialogShowMaterials", this.frgIdShowMaterials, "ShowMaterials", this);
        },
    });
});

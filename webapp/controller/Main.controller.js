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
    var sTarget = "01";
    var timeOutFecha;
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
				that.oModelGet.setProperty("/oCentro", oDataHana.consultarCenter);
				that.oModelGet.setProperty("/oFeriados", oDataHana.consultarFeriados);
				that.oModelGet.setProperty("/oHorasTrabajadas", oDataHana.consultarHorasTrabajadas);
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
        	that.oModelGet.setProperty("/oCentro", []);
			that.oModelGet.setProperty("/oFeriados", []);
			that.oModelGet.setProperty("/oHorasTrabajadas", []);
			
			that.oModel.setProperty("/oEntregasConCita", []);
			that.oModel.setProperty("/oEntregasNoCita", []);
			that.oModel.setProperty("/DataPedidosEmbalar", []);
			
			that.oModel.setProperty("/oEntregaSelect", []);
			that.oModel.setProperty("/DataConstanteContadorRecuertoPen", []);
			that.oModel.setProperty("/DataConstanteFechaInicialPen", "");
			that.oModel.setProperty("/DataPedidosEmbalar", []);
			that.oModel.setProperty("/oDataHorarioValidatePen", "");
			that.oModel.setProperty("/oRangoFecha", []);
			that.oModel.setProperty("/sConstanteContadorPen", 0);
			that.oModel.setProperty("/DataConstante",[]);
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
                            "LugEntD": y[0].LugEntD,
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
                	sTarget="01";
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
                	sTarget="02";
                    this._byId("btMakeAppointment").setVisible(true);
                    this._byId("btChangeOrder").setVisible(true);
                    this._byId("btDeleteOrder").setVisible(true);

                    this._byId("btOrderNoOC").setVisible(false);
                    this._byId("btOrderOC").setVisible(false);
                    this._byId("btUpdateRegister").setVisible(false);
                    this._byId("btUpdateDate").setVisible(false);
                    this._byId("btDeleteAppointment").setVisible(false);

                    this._byId("btDeleteOrder").setEnabled(true);
                    this._byId("btChangeOrder").setEnabled(true);
                    break;
                case "keyTabFilterCitEnt" :
                	sTarget="03";
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
            var sTable = "";
            var oEntregaSelect = [];
            if(sTarget == "02"){
            	sTable = "TreeTableBasic";
            }else{
            	sTable = "TreeTableBasic2";
            }
            var oTable = that.byId(sTable);
            var oIndeces = oTable.getSelectedIndices();
            if(oIndeces.length===0){
                utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
			    return;
            }else{
            	oIndeces.forEach(function(value){
					var jEntSelect = oTable.getContextByIndex(value).getObject();
					oEntregaSelect.push(jEntSelect);
				});
				
				that.oModel.setProperty("/oEntregaSelect", oEntregaSelect);
				if(oEntregaSelect[0].LugEntD === "01"){
					this.fnDateProgram();
				}else{
					this.fnDateNotProgram(oEntregaSelect);
				}
            }
        },
        fnDateProgram: function(){
        	var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
        	if(sTarget==="02"){
        		that.oModel.setProperty("/sConstanteContadorPen" ,parseInt(that.oModelGet.getProperty("/oHorasTrabajadas")[0].CONTADOR) );
        	}
        	var fechas=[];
			var fecha_max="";
			var fecha_min="";
			var arrcontador =[];
			
			var dateActual=new Date();
			fechas.push(dateActual.getTime());
			
			var max = Math.max(...fechas);
			var min = Math.min(...fechas);
			if(max == min ){
				fecha_max = "";
				fecha_min = this.formatYYYYMMDDNotDayAbapStringDate("/Date("+fechas[0]+")/");
			}else{
				fecha_max=""
				fecha_min = this.formatYYYYMMDDNotDayAbapStringDate("/Date("+fechas[0]+")/");
			}
			that.oModel.setProperty("/oRangoFecha",fechas);
				
            this.setFragment("_dialogFechaPlan", this.frgIdFechaPlan, "FechaPlan", this);
            
			sap.ui.core.BusyIndicator.show(0);
            
            that._byId(this.frgIdFechaPlan+"--fecharangoInicialPlan").setValue(fecha_min);
            that._byId(this.frgIdFechaPlan+"--fecharangoFinalPlan").setValue(fecha_max);
			that._byId(this.frgIdFechaPlan+"--nEntregaPlan").setValue(arrayOrdenes.length);
			
			this.getFilterConstantCentro("MM","SOLICITAR_CITA","CENTRO",arrcontador,true);
        },
        fnDateNotProgram: function(oEntrega){
        	
        },
        getFilterConstantCentro:function(modulo,aplicativo,funcion,arrcontador,ejecucion){
        	var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
			that._byId(this.frgIdFechaPlan+"--tbRegistroDisponible").clearSelection();
			var extra =1;
			
			var contador=0;
			var data = that.oModelGet.getProperty("/oCentro");
			var estatefecha = false;
			if(data.length >0){
				for(var i=0;i<data.length;i++){
					for(var j=0;j<arrayOrdenes.length;j++){
						if(data[i].CENTRO == arrayOrdenes[j].Werks){
							contador++;
						}
					}
				}
			}
			
			if(contador==0){
				that.getFilterConstant("MM","SOLICITAR_CITA","HORARIO",arrcontador,extra,estatefecha,ejecucion);
			}else{
				that.getFilterConstant("MM","SOLICITAR_CITA","HORARIO",arrcontador,extra,estatefecha,ejecucion);
			}
		},
		getFilterConstant:function(modulo,aplicativo,funcion,arrcontador,extra,estatefecha,ejecucion){
			var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
			var arrFeriados = that.oModelGet.getProperty("/oFeriados");
			var contador="";
			if(sTarget === "02"){
				contador=that.oModel.getProperty("/sConstanteContadorPen");
			}
			
			var fecha_rangfin=that._byId(this.frgIdFechaPlan+"--fecharangoFinalPlan").getValue();
			var fecha_rangini=that._byId(this.frgIdFechaPlan+"--fecharangoInicialPlan").getValue();
			var rangoFecha = that.oModel.getProperty("/oRangoFecha");
			var dateActual=new Date(rangoFecha[0]);
			var fechaDateActual= fecha_rangini+" "+
					dateActual.getHours()+ ":" +
					dateActual.getMinutes()+":"+
					dateActual.getSeconds()
			var fechaDateActual2=fecha_rangini;
			var fecha_min = that._byId(this.frgIdFechaPlan+"--fecharangoInicialPlan").getValue();
			var fecha_max = that._byId(this.frgIdFechaPlan+"--fecharangoFinalPlan").getValue();
			var arrHorario = [];
			var arrRangoFecha = [];
			var arrRangoFechaValidacion = [];
			var validateFeriado=true;
			
			if(fecha_max == ""){
				for(var i=0;i<arrFeriados.length;i++){
					if(fecha_min == that.getFormatPuntInYYYYMMDD(arrFeriados[i].DESCRIPCION)){
						validateFeriado = false;
					}
				}
					
				if(validateFeriado){
					arrRangoFecha.push(fecha_min);
				}
			}else{
				var fechaInicio = this.formatosFilterDateRegistro(fecha_min);
				var fechaFin    = this.formatosFilterDateRegistro(fecha_max);
				
				while(fechaFin.getTime() >= fechaInicio.getTime()){
					validateFeriado = true;
					fechaInicio.setDate(fechaInicio.getDate() + 1);
					var date =  that.formatosCellValidateNumbers(fechaInicio.getDate())+ '.' + that.formatosCellValidateNumbers(fechaInicio.getMonth() + 1)+'.' +fechaInicio.getFullYear()  ;
					
					
					for(var i=0;i<arrFeriados.length;i++){
						if(date == arrFeriados[i].dateFormatter){
							validateFeriado = false;
						}
					}
					
					if(validateFeriado){
						if(fechaInicio.getDay() == 6 || fechaInicio.getDay() == 0){
						}else{
							arrRangoFechaValidacion.push(date);
						}
						arrRangoFecha.push(date);
					}
					
				}
			}
			
			var dataStandar =new Date(fechaDateActual)
			dataStandar=that.getYYYYMMDD(dataStandar);
			
			var fechadiaSemana=new Date(fecha_min);		
			that.oModel.setProperty("/oDataHorarioValidatePen" ,dataStandar);
			
			if(fechadiaSemana.getDay() == 6 || fechadiaSemana.getDay() == 0){
				extra++;
			}
			
			var Centro = arrayOrdenes[0].Werks;
			if(arrRangoFechaValidacion.length<=7){
				var filtro = {
					"oResults": {
						"MODULO": modulo,
						"APLICATIVO": aplicativo,
						"FUNCION": funcion,
						"CENTRO": Centro
					}
				};
				Services.ConsultarEntregaHorariosPorCentro(that, filtro, function (result) {
					util.response.validateAjaxGetHana(result, {
						success: function (oData, message) {
							var data = oData.oResults.oData.Constante.oData;
							var dataHoraTrabajada = that.oModelGet.getProperty("/oHorasTrabajadas");//2
							if(data.length>0){
								data.sort(function(x,y) {return x.DESDE-y.DESDE})
								if(dataHoraTrabajada.length > 0){
									if(dataHoraTrabajada[0].CONTADOR != "0"){
										that._byId(that.frgIdFechaPlan+"--fecharangoInicialPlan").setEnabled(true);
										that._byId(that.frgIdFechaPlan+"--fecharangoFinalPlan").setEnabled(true);
										var primero = true;
										for(var a = 0; a<arrRangoFecha.length;a++){
											var FECHAS = arrRangoFecha[a];
											for(var i=0;i<data.length;i++){
												var desde = parseInt(data[i].DESDE);
												var hasta = parseInt(data[i].HASTA);
												var nEntregas = data[i].NUMERO_ENTREGA;
												var cantProveedores = data[i].CONTADOR;
												var rango_horas = hasta - desde;
												var fechacompobj2=FECHAS;
												if(new Date(fechacompobj2).getDay() == 6 || new Date(fechacompobj2).getDay() == 0){
													estatefecha = true;
													primero = false;
												}else{
													for(var k = 0;k < rango_horas ;k++){
														var obj={};
														obj.NUMERO_ENTREGA = nEntregas;
														obj.FECHAS = FECHAS;
														obj.STATUS = "No Disponible";
														obj.HORARIOS = that.formatosFechasHoras(desde+k);
														obj.PROVEEDORES = cantProveedores;
														var fechacompobj=obj.FECHAS+" "+obj.HORARIOS;
														if(fechadiaSemana.getDay() == 6 || fechadiaSemana.getDay() == 0){
															estatefecha = true;
															primero = false;
															arrHorario=[];
														}else{
															estatefecha = false;
															if( ( new Date(fechaDateActual2).getTime()+ extra * 24  * 60  * 60 * 1000) == new Date(obj.FECHAS).getTime() ){
																primero = false;
															}	
															if(	dateActual.getTime() <= new Date(fechacompobj).getTime() ){
																arrHorario.push(obj);
															}
														}
													}
												}
											}
										}
										
										console.log(arrHorario)
										
										var fechavalidate =new Date(fechaDateActual)
										fechavalidate=that.getYYYYMMDD(fechavalidate);
										
										if(arrHorario.length >contador){
											if(fecha_max == ""){
												if(that.oModel.getProperty("/DataConstanteFechaInicialPen")){
													if(that.oModel.getProperty("/DataConstanteFechaInicialPen") == that._byId(that.frgIdFechaPlan+"--fecharangoInicialPlan").getValue()){
														for(var i=0;i<contador;i++){
															arrHorario.shift();
														} 
													}
												}else{
													for(var i=0;i<contador;i++){
														arrHorario.shift();
													} 
													var newFecha=that.getYYYYMMDD(new Date());
													that.oModel.setProperty("/DataConstanteFechaInicialPen" ,newFecha);
													arrcontador.push(contador)
													that.oModel.setProperty("/DataConstanteContadorRecuertoPen" ,arrcontador);
												}
												that.oModel.setProperty("/DataConstante" ,arrHorario);
												sap.ui.core.BusyIndicator.hide(0);
												that.getFilterTableFechaWhere(ejecucion);
											}else{
												var cant = arrHorario.length;
												const myObj = {}
												
												for ( var i=0, len=arrHorario.length; i < len; i++ )
											    myObj[arrHorario[i]['FECHAS']] = arrHorario[i].FECHAS;
												
												var arrHorario2 = new Array();
												for ( var key in myObj )
												arrHorario2.push(myObj[key]);
												var contador2 =contador*(arrHorario2.length)
												if(contador== parseInt(dataHoraTrabajada[0].CONTADOR) && fecha_min!=(fechavalidate)){
													that.oModel.setProperty("/DataConstante" ,arrHorario);
													sap.ui.core.BusyIndicator.hide(0);
													that.getFilterTableFechaWhere(ejecucion);
												}else if(fecha_min==fechavalidate ) {
													if(arrHorario.length < contador2){
														contador = contador2-arrHorario.length;
														that.oModel.setProperty("/DataConstanteContadorPen" ,contador);
														arrcontador.push(contador)
														that.oModel.setProperty("/DataConstanteContadorRecuertoPen" ,arrcontador);
														var nuevaFecha=(arrHorario[0].FECHAS).split(".");
														var newdia=nuevaFecha[0];
														var newmes=nuevaFecha[1];
														var newanio=nuevaFecha[2];
														var newFecha=arrHorario[0].FECHAS;
														
														that.oModel.setProperty("/DataConstanteFechaInicialPen" ,newFecha);
														that._byId(that.frgIdFechaPlan+"--fecharangoInicialPlan").setValue(newFecha)
														that.getFilterConstant("MM","SOLICITAR_CITA","CENTRO",arrcontador,extra,ejecucion);
													}else{
														for(var i=0;i<contador;i++){
															arrHorario.shift();
														} 
														that.oModel.setProperty("/DataConstante" ,arrHorario);
														sap.ui.core.BusyIndicator.hide(0);
														that.getFilterTableFechaWhere(ejecucion);
													}
												}else{
													for(var i=0;i<contador;i++){
														arrHorario.shift();
													} 
													that.oModel.setProperty("/DataConstante" ,arrHorario);
													sap.ui.core.BusyIndicator.hide(0);
													that.getFilterTableFechaWhere(ejecucion);
												}
											}
										}else if( contador==parseInt(dataHoraTrabajada[0].CONTADOR) && fecha_min!=(fechavalidate) && primero){
											if(estatefecha){
		                                        contador = contador - arrHorario.length;
		                                        ModeloProyect.setProperty("/DataConstanteContadorPen" ,contador);
												arrcontador.push(contador)
												ModeloProyect.setProperty("/DataConstanteContadorRecuertoPen" ,arrcontador);
												var nuevaFecha=fecha_min
		
												var newFecha=new Date( (new Date(fecha_min)).getTime()+(1 *24  * 60  * 60 * 1000) );
												newFecha =that.getYYYYMMDD(newFecha);
		
												ModeloProyect.setProperty("/DataConstanteFechaInicialPen" ,newFecha);
												that._byId(that.frgIdFechaPlan+"--fecharangoInicialPlan").setValue(newFecha)
												that.getFilterConstant("MM","SOLICITAR_CITA","HORARIO",arrcontador,extra,estatefecha,ejecucion);
											}
											else{
												that.oModel.setProperty("/DataConstante" ,arrHorario);
												sap.ui.core.BusyIndicator.hide(0);
												that.getFilterTableFechaWhere(ejecucion);
											}
										}else{
											contador = contador - arrHorario.length;
											that.oModel.setProperty("/sConstanteContadorPen" ,contador);
											arrcontador.push(contador)
											that.oModel.setProperty("/DataConstanteContadorRecuertoPen" ,arrcontador);
											var nuevaFecha=(fecha_min)
											
											var newFecha=new Date( (new Date(nuevaFecha)).getTime()+(1 *24  * 60  * 60 * 1000) );
											newFecha =that.getYYYYMMDD(newFecha);
											
											that.oModel.setProperty("/DataConstanteFechaInicialPen" ,newFecha);
											that._byId(that.frgIdFechaPlan+"--fecharangoInicialPlan").setValue(newFecha)
											that.getFilterConstant("MM","SOLICITAR_CITA","HORARIO",arrcontador,extra,estatefecha,ejecucion);
										}
									}else{
										that._byId(that.frgIdFechaPlan+"--fecharangoInicialPlan").setEnabled(false);
										that._byId(that.frgIdFechaPlan+"--fecharangoFinalPlan").setEnabled(false);
										that.oModel.setProperty("/oFechasDisponibles", [] );
										that.oModel.setProperty("/oFechasDisponiblesNoProg", [] );
										utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorHorasTrabMayor0"));
										sap.ui.core.BusyIndicator.hide(0);
									}
								}else{
									that._byId(that.frgIdFechaPlan+"--fecharangoInicialPlan").setEnabled(false);
									that._byId(that.frgIdFechaPlan+"--fecharangoFinalPlan").setEnabled(false);
									that.oModel.setProperty("/oFechasDisponibles", [] );
									that.oModel.setProperty("/oFechasDisponiblesNoProg", [] );
									utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorHoraTrabajadas"));
									sap.ui.core.BusyIndicator.hide(0);
								}
							}else{
								that._byId(that.frgIdFechaPlan+"--fecharangoInicialPlan").setEnabled(false);
								that._byId(that.frgIdFechaPlan+"--fecharangoFinalPlan").setEnabled(false);
								that.oModel.setProperty("/oFechasDisponibles", [] );
								that.oModel.setProperty("/oFechasDisponiblesNoProg", [] );
								utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorHorarioCentro"));
								sap.ui.core.BusyIndicator.hide(0);
							}
						},
						error: function (message) {
							sap.ui.core.BusyIndicator.hide(0);
						}
					});
				});
			}else{
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorRangoMenorFecha"));
				sap.ui.core.BusyIndicator.hide(0);
			}
		},
		getFilterTableFechaWhere:function(ejecucion){
			var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
			var DataConstanteCentro=that.oModelGet.getProperty("/oCentro")
			var dataConsta=that.oModel.getProperty("/DataConstante");
			
			var fecha_max=that._byId(this.frgIdFechaPlan+"--fecharangoFinalPlan").getValue();
			var fecha_min=that._byId(this.frgIdFechaPlan+"--fecharangoInicialPlan").getValue();
			var oData=[]
			DataConstanteCentro.forEach(function(value){
				oData.push(value.CENTRO)
			});
                   
			var sURL = "/hana/IPROVIDER_ENTREGA/REGISTRO_FECHA/RegistroFechaTotalFiltar.xsjs?fecha_min="+this.reverseStringForParameter(fecha_min.replaceAll("/","."), ".")+"&fecha_max="+this.reverseStringForParameter(fecha_max.replaceAll("/","."), ".");
			$.ajax({
				url: sURL,
				method: "POST",
				contentType: 'application/json',
				data		:JSON.stringify(oData),
				success: function (data) {
					var arr = [];
					for(var i=0;i<Object.keys(data).length;i++){
						data[i].FECHA=(data[i].FECHA).split("T")[0]
						data[i].HORA=(data[i].HORA).split("T")[1].split(".")[0]
						arr.push(data[i]);
					}
					
					var totalEntregaRegistrados=0;
					var totalProvRegistrados = 0;
					
					//Adicionar Proveedor
					var arrProveedor=[];
					var arrProv=[];
					for(var i=0;i<dataConsta.length;i++){
						var dateConst = that.formatosFilterDate(dataConsta[i].FECHAS,dataConsta[i].HORARIOS).getTime();
						dataConsta[i].STATUS = "No Disponible"
						totalEntregaRegistrados = 0;
						totalProvRegistrados = 0;
						arrProveedor=[];
						arrProv=[];
						for(var k=0;k<arr.length;k++){
							var dateFecha = new Date(arr[k].FECHA+" "+arr[k].HORA).getTime();
							if(dateConst === dateFecha){
								var entRegistrada = parseInt(arr[k].ENTREGAS_REGISTRADAS)
								var provRegistrada = 1
								totalEntregaRegistrados += entRegistrada;
								arrProv.push(arr[k]);
							}
						}
						
						arrProveedor = arrProv;
						var cantProveedor = arrProveedor.length;
						const myObj2 = {};
						
						for ( var l=0, len=arrProveedor.length; l < len; l++ )
					    myObj2[arrProveedor[l]['PROVEEDOR']] = arrProveedor[l].PROVEEDOR;
						
						arrProveedor = new Array();
						for ( var key2 in myObj2 )
						arrProveedor.push(myObj2[key2]);
						
						totalProvRegistrados = arrProveedor.length;
						
						if(totalEntregaRegistrados<parseInt(dataConsta[i].NUMERO_ENTREGA)){
							if(parseInt(dataConsta[i].PROVEEDORES) > totalProvRegistrados){
								dataConsta[i].STATUS = "Disponible"
							}else{
								dataConsta[i].STATUS = "No Disponible"
							}
						}else{
							dataConsta[i].STATUS = "No Disponible"
						}
						
					}
					
					that.oModel.setProperty("/DataFecha" ,dataConsta);
					
					if(ejecucion){
						timeOutFecha = setTimeout(
							function(){
								that.getFilterTableFechaWhere(true);
								console.log("timeOut");
							}
						, 1000);
					}
				},error: function (e) {
					if(ejecucion){
						timeOutFecha = setTimeout(
							function(){
								that.getFilterTableFechaWhere(true);
								console.log("timeOut");
							}
						, 1000);
					}
				}
			});
		},
		_onPressCloseFechaPlan: function (oEvent){
			var oSource = oEvent.getSource();
			var sCustom = oSource.data("custom");
			clearTimeout(timeOutFecha);
			this.fnClearDataFechaPlan();
			this.fnClearComponentFechaPlan();
			oSource.getParent().close();
		},
		fnClearDataFechaPlan: function () {
			that.oModel.setProperty("/oEntregaSelect", []);
			that.oModel.setProperty("/DataConstanteContadorRecuertoPen", []);
			that.oModel.setProperty("/DataConstanteFechaInicialPen", "");
			that.oModel.setProperty("/DataPedidosEmbalar", []);
			that.oModel.setProperty("/oDataHorarioValidatePen", "");
			that.oModel.setProperty("/oRangoFecha", []);
			that.oModel.setProperty("/sConstanteContadorPen", 0);
			that.oModel.setProperty("/DataConstante",[]);
		},
		fnClearComponentFechaPlan: function () {
			that._byId(this.frgIdFechaPlan+"--tbRegistroDisponible").clearSelection(true);
			that._byId(this.frgIdFechaPlan+"--fecharangoInicialPlan").setValue("");
			that._byId(this.frgIdFechaPlan+"--fecharangoFinalPlan").setValue("");
			that._byId(this.frgIdFechaPlan+"--nEntregaPlan").setValue("");
		},
		
		ValidarCamposPendientes : function (oEvent){
			var contador=0;
			var contador2=0;
			var contador3=0;
			var contador4=0;
			var table = that._byId("TreeTableBasic");
			var context = oEvent.getParameter("rowContext");
			if(context != null){
				var object = that.oModel.getProperty(context.sPath);
				var oIndex = oEvent.getParameter('rowIndex');
			
				var Selecciones =table.getSelectedIndices();
				var selectedEntries = [];
				for(var i=0; i<Selecciones.length; i++){
					var oData = table.getContextByIndex(Selecciones[i]);
					selectedEntries.push(oData.getProperty(oData.getPath ()));
				}
				if(Selecciones.length>1){
					if(selectedEntries.length >0){
						for(var i=0; i<selectedEntries.length; i++){
							if(selectedEntries[i].Desc_cond == object.Desc_cond){
								contador3++;
							}
							
						}
						if(contador3==0){}
						else if(contador3 != Selecciones.length){
							utilUI.onMessageErrorDialogPress2("Solo es posible seleccionar entregas de una misma condición");
							table.removeSelectionInterval(oIndex,oIndex);
							var i = selectedEntries.indexOf(object);
							if ( i !== -1 ) {
								selectedEntries.splice( i, 1 );
							}
							return;
						}
					}
					if(Object.keys(oDataCond).length >0){
						for(var j=0;j<Object.keys(oDataCond).length;j++){
							for(var i=0; i<selectedEntries.length; i++){
								if(oDataCond[j].DESCRIPCION == selectedEntries[i].desclugardestino){
									contador++;
								}
							}
						}
						if(contador==0){
							
						}
						else if(contador != Selecciones.length){
							table.removeSelectionInterval(oIndex,oIndex);
							var i = selectedEntries.indexOf(object);
							if ( i !== -1 ) {
								selectedEntries.splice( i, 1 );
							}
							return;
						}
					}
					
					if(Object.keys(oDataCentro).length >0){
						for(var j=0;j<Object.keys(oDataCentro).length;j++){
							for(var i=0; i<selectedEntries.length; i++){
								if(oDataCentro[j].CENTRO == selectedEntries[i].Centro){
									contador2++;
								}
							}
						}
						if(contador2==0){
							
						}
						else if(contador2 != Selecciones.length){
							table.removeSelectionInterval(oIndex,oIndex);
							var i = selectedEntries.indexOf(object);
							if ( i !== -1 ) {
								selectedEntries.splice( i, 1 );
							}
							return;
						}
					}
				}
				if(!object.Vbeln.toString()){
					table.removeSelectionInterval(oIndex,oIndex);
				}
			}
		},
		_onPressDeleteEnt: function (oEvent){
			var oSource = oEvent.getSource();
            var oRow = oSource.getParent();
            var sTable = "";
            var oEntregaSelect = [];
            if(sTarget == "02"){
            	sTable = "TreeTableBasic";
            }else{
            	sTable = "TreeTableBasic2";
            }
            var oTable = that.byId(sTable);
            var oIndeces = oTable.getSelectedIndices();
			
			if(oIndeces.length===0){
                utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
			    return;
            }else{
				oIndeces.forEach(function(value){
					var jEntSelect = oTable.getContextByIndex(value).getObject();
					oEntregaSelect.push(jEntSelect);
				});
				if(sTarget === "02"){
					if(oIndeces.length===0){
						utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
				    	return;
					}
					if(oEntregaSelect.length > 1){
						utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorDeleteOneEnt"));
				    	return;
					}
					utilUI.messageBox(this.getI18nText("sConfirmDeleteEnt"), "C", function (value) {
						if (value) {
							that.fnOperacionEliminarEntregaTarget2(oEntregaSelect);
						}
					});
				}else if(target==="03"){
					
					if (EntregasSelecionadas.length === 0){
						MessageToast.show("Seleccione una Entrega");
						return;
					}	
					
					if (EntregasSelecionadas.length > 1){
						MessageToast.show("Solo se puede eliminar una Entrega");
						return;
					}
					
					var validateCita=[];
					validateCita = that.validateCita();
					
					var validateHorario=[];
					validateHorario = that.validateHorario();
					if(EntregasSelecionadas[0].numCitas){
						if(validateCita.entregas.length == 1){
							utilUI.onMessageErrorDialogPress2("Para eliminar la entrega primero se debe eliminar la Cita");
							return ;
						}
					}
							
					if(validateHorario.validate){
						var condicion = true;
						if(EntregasSelecionadas[0].codtipoData == '01'){
							condicion = true;
						}else{
							condicion = false;
						}
						sap.m.MessageBox.warning("¿Desea eliminar la Entrega? ", {
										title: "Mensaje",
										actions: [
											"Si",
											"Cancelar"
										],
										onClose: function (sActionClicked) {
											if(sActionClicked==="Si"){
												Busy.open();
												
												var dataOrdenesERP = [];
												var dataOrdenesSCP = [];
												
												for(var i = 0; i < arrayOrdenes.length ; i++){
													var Ordenes = arrayOrdenes[i];
													if(Ordenes.codtipoData == "01"){
														dataOrdenesERP.push(Ordenes);
													}else if(Ordenes.codtipoData == "02"){
														dataOrdenesSCP.push(Ordenes);
													}
												}
												
												if(dataOrdenesERP.length>0){
													that.OperacionEliminarEntregaERP(dataOrdenesERP,dataOrdenesSCP,true);
												}else{
													that.OperacionEliminarEntregaSCP(dataOrdenesSCP,"La entrega " + dataOrdenesSCP[0].DescripcionGeneralEntrega+" ha sido eliminada");
												}
												
											
											}
										}
									});	
					}else{
						utilUI.onMessageErrorDialogPress2(validateHorario.msj);
					}
				}
			}
		},
		fnOperacionEliminarEntregaTarget2 : function (arrayOrdenes){
			var EntregasERP	=[];
			var EntregaSCP	=[];
			EntregaSCP = arrayOrdenes.filter(function(obj){
				return	obj.codtipoData === "02" ;
			});
			EntregasERP = arrayOrdenes.filter(function(obj){
				return	obj.codtipoData === "01" ;
			});
			
			if(EntregasERP.length > 0) {
				var Entregas_a_Eliminar = [];
				var EntregaSap ;	
					
				EntregasERP.map(function(obj){
					 EntregaSap = {
						"Cont":"1",
						"Vbeln":obj.Vbeln.toString(),//Entrega a Eliminar al Sap
						"Cita":"",
						"Message":""
					}
					Entregas_a_Eliminar.push(EntregaSap);
				});
				
				var dataE = {
					"Eliminar":"X",
					"ItemEntSet":Entregas_a_Eliminar,
					"NAVRESULT":[
						{
							"Mensaje2":"",
							"Mensaje":""
						}
					]
				};
				var oResults = {
					"oResults" : dataE
				};
				sap.ui.core.BusyIndicator.show(0);
				Services.DeleteEntregaConOC(this, oResults, function (result) {
					util.response.validateFunctionSingleEnd(result, {
						success: function (data, message) {
							utilUI.messageBox(that.getI18nText("sSuccessDeleteEnt"), "S", function (value) {
								if (value) {
									that.handleRouteMatched();	
								}
							});
						},
						error: function (message) {
							sap.ui.core.BusyIndicator.hide(0);
						}
					});
				});
			}else if (EntregaSCP.length > 0){
				var EntregaEliminar=[];
				EntregaSCP.map(function(obj){
					EntregaEliminar.push(obj.Vbeln.toString());
				});
				var dataSinOCHanna = {
					"oResults" : {
						"ENTREGA" : EntregaEliminar
					}
				};
				sap.ui.core.BusyIndicator.show(0);
				Services.EliminarEntregaTarget2(that, dataSinOCHanna, function (result) {
					util.response.validateFunctionSingleEnd(result, {
						success: function (data, message) {
							utilUI.messageBox(that.getI18nText("sSuccessDeleteEnt") , "S", function (value) {
								if (value) {
									that.handleRouteMatched();	
								}
							});
						},
						error: function (jqXHR,textStatus,errorThrown ) {
							sap.ui.core.BusyIndicator.hide(0);
						}
					});
				});	
			}
		},
		ValidarCamposEmbalar: function (oEvent) {
			var table = this.byId("TreeTable");
			var context = oEvent.getParameter("rowContext");
			if (context != null) {
				var path = context.sPath;
				var Object = that.oModel.getProperty(path);
			}
			var oIndex = oEvent.getParameter('rowIndex');
			var Selecciones = table.getSelectedIndices();
			var selectedEntriesProvi = [];
			var selectedEntries = [];

			for (var i = 0; i < Selecciones.length; i++) {
				var oData = table.getContextByIndex(Selecciones[i]);
				selectedEntries.push(oData.getProperty(oData.getPath()));
			}
			if (Selecciones.length > 1) {
				if (selectedEntries[0].Xhupf != selectedEntries[Selecciones.length - 1].Xhupf || selectedEntries[0].PstypD != selectedEntries[
						Selecciones.length - 1].PstypD || selectedEntries[0].NamelD != selectedEntries[Selecciones.length - 1].NamelD) {
					utilUI.onMessageErrorDialogPress2(that.getI18nText("sErroCamposEmbalar"));
					table.removeSelectionInterval(oIndex, oIndex);
					var i = selectedEntries.indexOf(Object);
					if (i !== -1) {
						selectedEntries.splice(i, 1);
					}
				}
			}
			if (Object !== undefined) {
				if (!Object.Ebeln) {
					table.removeSelectionInterval(oIndex, oIndex);
				}
			}
		},
		
    });
});

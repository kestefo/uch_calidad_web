sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"solicitarcitapr/controller/BaseController",
	"solicitarcitapr/model/models",
	"../constantes",
	"../services/Services",
	'../util/util',
	"../util/utilUI",
	"sap/ui/core/Fragment",
], function (Controller, BaseController, models, constantes, Services, util, utilUI, Fragment) {
	"use strict";

	var that;
	var iCont = 0;
	var sTarget = "01";
	var timeOutFecha;
	var validateTipoFecha = "01";
	var qrcode;
	return BaseController.extend("solicitarcitapr.controller.Main", {
		onInit: function () {
			that = this;
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("TargetMain").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			this.frgIdAddProduct = "frgIdAddProduct";
			this.frgIdShowMaterials = "frgIdShowMaterials";
			this.frgIdFechaPlan = "frgIdFechaPlan";
			this.frgIdFormatQR = "frgIdFormatQR";
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
			Promise.all([this.getDataMaestro(["T_ERP_STATUS", "T_ERP_AREA", "T_ERP_LUMP_TYPE", "T_ERP_UNIDADES"]), this.getDataHana()]).then(
				async values => {
					this.fnClearComponent();
					this.fnClearData();

					var oDataHana = values[1].oResults;
					that.oModelGet.setProperty("/oCentro", oDataHana.consultarCenter);
					that.oModelGet.setProperty("/oFeriados", oDataHana.consultarFeriados);
					that.oModelGet.setProperty("/oHorasTrabajadas", oDataHana.consultarHorasTrabajadas);
					that.oModelGet.setProperty("/oHorasTolerancia", oDataHana.consultarHorasTolerancia);
					//angellyn get data table 1
					var oDataPedEmb = oDataHana.OrdersToBePackaged;
					this._onEstructurePedEmb(oDataPedEmb);

					//jose get data table 1
					var oDataPedSinCita = oDataHana.WalInOrders;
					this._onEstructurePed(oDataPedSinCita, "04", "/oEntregasNoCita");

					//Uso de estado
					var oDataEstado = values[0].T_ERP_STATUS;
					that.oModelGet.setProperty("/oEstado", oDataEstado);

					//jose get data table 2
					var oDataPedConCita = oDataHana.WalInOrdersCit;
					this._onEstructurePedConCita(oDataPedConCita, "05", "/oEntregasConCita");
					that.eliminarPendiente();
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
			that.oModel.setProperty("/DataConstante", []);
			that.oModel.setProperty("/DataFecha", []);

			that.oModel.setProperty("/fecha", {});
			that.oModel.setProperty("/DataFechaNoProg", []);
			that.oModel.setProperty("/dataConcurrencia", []);

			that.oModel.setProperty("/LISTA_GENERAL_ERP", []);
			that.oModel.setProperty("/DataqrCitaTotal", []);
			that.oModel.setProperty("/DataarrCitaTotal", []);
			that.oModel.setProperty("/DataarrCita", []);
			that.oModel.setProperty("/DataarrQrBultos", []);
			that.oModel.setProperty("/DataarrQrBultosComplementario", []);
			
			if(timeOutFecha){
				clearTimeout(timeOutFecha);	
			}
		},
		fnClearComponent: function () {
			that._byId("TreeTableBasic2").clearSelection(true);
			that._byId("TreeTableBasic").clearSelection(true);
			that._byId("TreeTable").clearSelection(true);

			that._byId("TreeTable").collapseAll();
			that._byId("TreeTableBasic").collapseAll();
			that._byId("TreeTableBasic2").collapseAll();
		},

		_onEstructurePedEmb: function (oData) {
			var oResults = [];
			that = this,
				$.each(this._groupBy(oData, 'Butxt'), function (x, y) {
					var jSociedad = {
						"DescripcionGeneral": y[0].Butxt,
						"SociedadCodigo": y[0].Bukrs,
						"ArrayGeneral": []
					}

					var arrayCentro = [];
					$.each(that._groupBy(y, 'Werks'), function (xx, yy) {
						var jCentro = {
							"DescripcionGeneral": yy[0].NamewD,
							"CentroCodigo": yy[0].Werks,
							"ArrayGeneral": []
						}

						var arrayAlmacen = [];
						$.each(that._groupBy(yy, 'Lgort'), function (xxx, yyy) {
							var jAlmacen = {
								"AlmacenCodigo": yyy[0].Lgort,
								"DescripcionGeneral": yyy[0].NamelD,
								"ArrayGeneral": []
							}

							var arrayGroupOrden = [];
							$.each(that._groupBy(yyy, 'PstypD'), function (xxxx, yyyy) {
								var jGroupOrden = {
									"OrdenCodigo": yyyy[0].PstypD,
									"DescripcionGeneral": yyyy[0].PstypD === '0' ? that.getI18nText("ordenNormal") : that.getI18nText("ordenConsignacion"),
									"ArrayGeneral": []
								}

								var arrayOrden = [];
								$.each(that._groupBy(yyyy, 'Ebeln'), function (xxxxx, yyyyy) {
									yyyyy.forEach(function (value) {
										if (value.Xhupf === 0) {
											value.Xhupf = true;
										} else {
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
		_onEstructurePed: function (oDataPedSinCita, sFilter, sPropery) {
			var oResults = [];
			$.each(that._groupBy(oDataPedSinCita, 'Zzlfstk'), function (x, y) {
				var jEstado = {
					"DescripcionGeneral": y[0].Zzlfstk,
					"ArrayGeneral": y
				}

				if (y[0].Zzlfstk === sFilter) {
					oResults.push(jEstado);
				}
			});

			var oResults2 = [];

			oResults.forEach(function (value) {
				var oDataNew = value.ArrayGeneral;
				if (value.DescripcionGeneral === sFilter) {
					$.each(that._groupBy(oDataNew, 'Vbeln'), function (x, y) {
						if (y[0].COD != "02") {
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

			that.oModel.setProperty(sPropery, oResults2);
		},
		_onEstructurePedConCita: function (oDataPedConCita) {
			var oResults = [];
			$.each(that._groupBy(oDataPedConCita, 'Zzlfstk'), function (x, y) {
				var jEstado = {
					"DescripcionGeneral2": y[0].Zzlfstk,
					"ArrayGeneral2": y
				}

				if (y[0].Zzlfstk === "01" || y[0].Zzlfstk === "02" || y[0].Zzlfstk === "03" || y[0].Zzlfstk === "05" || y[0].Zzlfstk === "07") {
					oResults.push(jEstado);
				}
			});

			var oResults2 = [];

			oResults.forEach(function (value) {
				var oDataNew = value.ArrayGeneral2;
				$.each(that._groupBy(oDataNew, 'Zvbeln'), function (x, y) {
					if (y[0].COD != "02") {
						y[0].COD = "01";
						y[0].COD_DESC = "ERP";
						y[0].Zzlfstkdesc = "Ent. Aprobada";
						y[0].ZcitaNp = "PROGRAMADA";
					}
					
					var lugardestino = y[0].ZzlugEnt;
 					var desclugardestino = y[0].ZdescCond;

					var jResults = {
						"codtipoData": y[0].COD,
						"desctipoData": y[0].COD_DESC,
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
						"Zlifnr": y[0].Zlifnr,
						"Zwerks": y[0].Zwerks,
						"ZzlugEnt": y[0].ZzlugEnt,
						"ZdescCond": y[0].ZdescCond,
						"materiales": y,
					}
					oResults2.push(jResults);
				});
			});
			that.oModel.setProperty("/oEntregasConCita", oResults2);
		},
		eliminarPendiente: function () {
			var User = that.oModelUser.getData();
			var Proveedor = User.oDataAditional[0].Lifnr;
			if (Proveedor == undefined && Proveedor == "") {
				return;
			}

			var headers = util.http.generarHeaders(that);
			var objEnvio = {
				"oResults": {
					"USUARIO_P": User.Resources[0].id,
					"COD_ESTATUS": "02",
					"user": User.oDataAditional[0].Stcd1,
					"Arr": {
						"USUARIO_P": User.Resources[0].id,
						"COD_ESTATUS": "02",
						"user": User.oDataAditional[0].Stcd1
					}
				}
			}
			$.ajax({
				url: "/hana/IPROVIDER_ENTREGA/Entrega/Service/EliminarEntregaHoras/",
				timeout: 0,
				headers: headers,
				data: JSON.stringify(objEnvio),
				contentType: "application/json; charset=utf-8",
				context: that,
				method: "POST",
				async: true,
				success: function (response) {},
				error: function (xhr) {
					MessageBox.error("Ocurrio un error al obtener los datos del usuario logueado");
				}
			});

		},
		_onSelectPlan: function (oEvent) {
			var oSource = oEvent.getSource();
			var selectkey = oSource.getSelectedKey();

			switch (selectkey) {
			case "keyTabFilterPedEmb":
				sTarget = "01";
				this._byId("btOrderNoOC").setVisible(true);
				this._byId("btOrderOC").setVisible(true);

				this._byId("btChangeOrder").setVisible(false);
				this._byId("btDeleteOrder").setVisible(false);
				this._byId("btMakeAppointment").setVisible(false);
				this._byId("btUpdateRegister").setVisible(false);
				this._byId("btUpdateDate").setVisible(false);
				this._byId("btDeleteAppointment").setVisible(false);
				break;
			case "keyTabFilterGenCit":
				sTarget = "02";
				this._byId("btMakeAppointment").setVisible(true);
				this._byId("btChangeOrder").setVisible(true);
				this._byId("btDeleteOrder").setVisible(true);

				this._byId("btOrderNoOC").setVisible(false);
				this._byId("btOrderOC").setVisible(false);
				this._byId("btUpdateRegister").setVisible(false);
				this._byId("btUpdateDate").setVisible(false);
				this._byId("btDeleteAppointment").setVisible(false);

				break;
			case "keyTabFilterCitEnt":
				sTarget = "03";
				this._byId("btChangeOrder").setVisible(false);
				this._byId("btDeleteOrder").setVisible(false);
				this._byId("btDeleteAppointment").setVisible(true);

				this._byId("btUpdateRegister").setVisible(false);
				this._byId("btUpdateDate").setVisible(false);
				this._byId("btMakeAppointment").setVisible(false);
				this._byId("btOrderNoOC").setVisible(false);
				this._byId("btOrderOC").setVisible(false);

				break;
			}
		},
		_onPressShowMaterials: function (oEvent) {
			var oSource = oEvent.getSource();
			var oRow = oSource.getParent();
			var oRowData = oRow.getBindingContext("oModel").getObject();
			var oMaterial = oRowData.materiales;
			this.setFragment("_dialogShowMaterials", this.frgIdShowMaterials, "ShowMaterials", this);
			that.oModel.setProperty("/oEntregasNoCitaMateriales", oMaterial);
		},
		_onPressShowMaterials2: function (oEvent) {
			var oSource = oEvent.getSource();
			var oRow = oSource.getParent();
			var oRowData = oRow.getBindingContext("oModel").getObject();
			var oMaterial = oRowData.materiales;
			var oResults = [];
			oMaterial.forEach(function (value) {
				var jMaterial = {
					"COD": value.COD,
					"EbelnD": value.Exidv,
					"PosnrD": value.Zvgpos,
					"MatnrD": value.Zlfdat,
					"MaktxD": value.Zmaktx,
					"VemngD": value.Zvemng,
					"Vegr2D": value.Zunmed,
					"Ebelp": value.Zvgpos
				};
				oResults.push(jMaterial);
			});
			this.setFragment("_dialogShowMaterials", this.frgIdShowMaterials, "ShowMaterials", this);
			that.oModel.setProperty("/oEntregasNoCitaMateriales", oResults);
		},
		_onPressOrderNoOC: function () {
			that.oRouter.navTo("RouteOrderNoOC");
		},
		_onPressOrderOC: function () {
			var oTable = that.byId("TreeTable");
			var oIndeces = oTable.getSelectedIndices();
			var oMaterials = [];
			oIndeces.forEach(function (value) {
				var oOrdeneSelect = oTable.getContextByIndex(value).getObject();
				var oMaterialSelect = oOrdeneSelect.ArrayMaterial;
				oMaterialSelect.forEach(function (value2) {
					oMaterials.push(value2);
				})
			});

			if (oIndeces.length > 0) {
				this.getModel("oModel").setProperty("/oDataEntregaOCPrev", oMaterials);
				that.oRouter.navTo("RouteOrderOC");
			} else {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSelectOrden"));
				return;
			}
		},
		_onPressFechaPlan: function (oEvent) {
			var oSource = oEvent.getSource();
			var oRow = oSource.getParent();
			var sTable = "";
			var oEntregaSelect = [];
			if (sTarget == "02") {
				sTable = "TreeTableBasic";
			} else {
				sTable = "TreeTableBasic2";
			}
			var oTable = that.byId(sTable);
			var oIndeces = oTable.getSelectedIndices();
			if (oIndeces.length === 0) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
				return;
			} else {
				oIndeces.forEach(function (value) {
					var jEntSelect = oTable.getContextByIndex(value).getObject();
					oEntregaSelect.push(jEntSelect);
				});

				that.oModel.setProperty("/oEntregaSelect", oEntregaSelect);
				if (oEntregaSelect[0].LugEntD === "01") {
					this.fnDateProgram();
					validateTipoFecha = "01";
				} else {
					this.fnDateNotProgram(oEntregaSelect);
					validateTipoFecha = "01";
				}
			}
		},
		fnDateProgram: function () {
			var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
			if (sTarget === "02") {
				that.oModel.setProperty("/sConstanteContadorPen", parseInt(that.oModelGet.getProperty("/oHorasTrabajadas")[0].CONTADOR));
			}
			var fechas = [];
			var fecha_max = "";
			var fecha_min = "";
			var arrcontador = [];

			var dateActual = new Date();
			fechas.push(dateActual.getTime());

			var max = Math.max(...fechas);
			var min = Math.min(...fechas);
			if (max == min) {
				fecha_max = "";
				fecha_min = this.formatYYYYMMDDNotDayAbapStringDate("/Date(" + fechas[0] + ")/");
			} else {
				fecha_max = ""
				fecha_min = this.formatYYYYMMDDNotDayAbapStringDate("/Date(" + fechas[0] + ")/");
			}
			that.oModel.setProperty("/oRangoFecha", fechas);

			this.setFragment("_dialogFechaPlan", this.frgIdFechaPlan, "FechaPlan", this);

			sap.ui.core.BusyIndicator.show(0);

			that._byId(this.frgIdFechaPlan + "--fecharangoInicialPlan").setValue(fecha_min);
			that._byId(this.frgIdFechaPlan + "--fecharangoFinalPlan").setValue(fecha_max);
			that._byId(this.frgIdFechaPlan + "--nEntregaPlan").setValue(arrayOrdenes.length);

			this.getFilterConstantCentro("MM", "SOLICITAR_CITA", "CENTRO", arrcontador, true);
		},
		fnDateNotProgram: function (oEntrega) {

		},
		getFilterConstantCentro: function (modulo, aplicativo, funcion, arrcontador, ejecucion) {
			var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
			that._byId(this.frgIdFechaPlan + "--tbRegistroDisponible").clearSelection();
			var extra = 1;

			var contador = 0;
			var data = that.oModelGet.getProperty("/oCentro");
			var estatefecha = false;
			if (data.length > 0) {
				for (var i = 0; i < data.length; i++) {
					for (var j = 0; j < arrayOrdenes.length; j++) {
						if (data[i].CENTRO == arrayOrdenes[j].Werks) {
							contador++;
						}
					}
				}
			}

			if (contador == 0) {
				that.getFilterConstant("MM", "SOLICITAR_CITA", "HORARIO", arrcontador, extra, estatefecha, ejecucion);
			} else {
				that.getFilterConstant("MM", "SOLICITAR_CITA", "HORARIO", arrcontador, extra, estatefecha, ejecucion);
			}
		},
		getFilterConstant: function (modulo, aplicativo, funcion, arrcontador, extra, estatefecha, ejecucion) {
			var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
			var arrFeriados = that.oModelGet.getProperty("/oFeriados");
			var contador = "";
			if (sTarget === "02") {
				contador = that.oModel.getProperty("/sConstanteContadorPen");
			}

			var fecha_rangfin = that._byId(this.frgIdFechaPlan + "--fecharangoFinalPlan").getValue();
			var fecha_rangini = that._byId(this.frgIdFechaPlan + "--fecharangoInicialPlan").getValue();
			var rangoFecha = that.oModel.getProperty("/oRangoFecha");
			var dateActual = new Date(rangoFecha[0]);
			var fechaDateActual = fecha_rangini + " " +
				dateActual.getHours() + ":" +
				dateActual.getMinutes() + ":" +
				dateActual.getSeconds()
			var fechaDateActual2 = fecha_rangini;
			var fecha_min = that._byId(this.frgIdFechaPlan + "--fecharangoInicialPlan").getValue();
			var fecha_max = that._byId(this.frgIdFechaPlan + "--fecharangoFinalPlan").getValue();
			var arrHorario = [];
			var arrRangoFecha = [];
			var arrRangoFechaValidacion = [];
			var validateFeriado = true;

			if (fecha_max == "") {
				for (var i = 0; i < arrFeriados.length; i++) {
					if (fecha_min == that.getFormatPuntInYYYYMMDD(arrFeriados[i].DESCRIPCION)) {
						validateFeriado = false;
					}
				}

				if (validateFeriado) {
					arrRangoFecha.push(fecha_min);
				}
			} else {
				var fechaInicio = new Date(fecha_min);
				var fechaFin = new Date(fecha_max);

				while (fechaFin.getTime() >= fechaInicio.getTime()) {
					validateFeriado = true;
					var date = that.getYYYYMMDD(fechaInicio);
					for (var i = 0; i < arrFeriados.length; i++) {
						if (date == arrFeriados[i].dateFormatter) {
							validateFeriado = false;
						}
					}

					if (validateFeriado) {
						if (fechaInicio.getDay() == 6 || fechaInicio.getDay() == 0) {} else {
							arrRangoFechaValidacion.push(date);
						}
						arrRangoFecha.push(date);
					}

					fechaInicio.setDate(fechaInicio.getDate() + 1);
				}
			}

			var dataStandar = new Date(fechaDateActual)
			dataStandar = that.getYYYYMMDD(dataStandar);

			var fechadiaSemana = new Date(fecha_min);
			that.oModel.setProperty("/oDataHorarioValidatePen", dataStandar);

			if (fechadiaSemana.getDay() == 6 || fechadiaSemana.getDay() == 0) {
				extra++;
			}

			var Centro = arrayOrdenes[0].Werks;
			if (arrRangoFechaValidacion.length <= 7) {
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
							var dataHoraTrabajada = that.oModelGet.getProperty("/oHorasTrabajadas"); //2
							if (data.length > 0) {
								data.sort(function (x, y) {
									return x.DESDE - y.DESDE
								})
								if (dataHoraTrabajada.length > 0) {
									if (dataHoraTrabajada[0].CONTADOR != "0") {
										that._byId(that.frgIdFechaPlan + "--fecharangoInicialPlan").setEnabled(true);
										that._byId(that.frgIdFechaPlan + "--fecharangoFinalPlan").setEnabled(true);
										var primero = true;
										for (var a = 0; a < arrRangoFecha.length; a++) {
											var FECHAS = arrRangoFecha[a];
											for (var i = 0; i < data.length; i++) {
												var desde = parseInt(data[i].DESDE);
												var hasta = parseInt(data[i].HASTA);
												var nEntregas = data[i].NUMERO_ENTREGA;
												var cantProveedores = data[i].CONTADOR;
												var rango_horas = hasta - desde;
												var fechacompobj2 = FECHAS;
												if (new Date(fechacompobj2).getDay() == 6 || new Date(fechacompobj2).getDay() == 0) {
													estatefecha = true;
													primero = false;
												} else {
													for (var k = 0; k < rango_horas; k++) {
														var obj = {};
														obj.NUMERO_ENTREGA = nEntregas;
														obj.FECHAS = FECHAS;
														obj.STATUS = "No Disponible";
														obj.HORARIOS = that.formatosFechasHoras(desde + k);
														obj.PROVEEDORES = cantProveedores;
														var fechacompobj = obj.FECHAS + " " + obj.HORARIOS;
														if (fechadiaSemana.getDay() == 6 || fechadiaSemana.getDay() == 0) {
															estatefecha = true;
															primero = false;
															arrHorario = [];
														} else {
															estatefecha = false;
															if ((new Date(fechaDateActual2).getTime() + extra * 24 * 60 * 60 * 1000) == new Date(obj.FECHAS).getTime()) {
																primero = false;
															}
															if (dateActual.getTime() <= new Date(fechacompobj).getTime()) {
																arrHorario.push(obj);
															}
														}
													}
												}
											}
										}

										console.log(arrHorario)

										var fechavalidate = new Date(fechaDateActual)
										fechavalidate = that.getYYYYMMDD(fechavalidate);

										if (arrHorario.length > contador) {
											if (fecha_max == "") {
												if (that.oModel.getProperty("/DataConstanteFechaInicialPen")) {
													if (that.oModel.getProperty("/DataConstanteFechaInicialPen") == that._byId(that.frgIdFechaPlan +
															"--fecharangoInicialPlan").getValue()) {
														for (var i = 0; i < contador; i++) {
															arrHorario.shift();
														}
													}
												} else {
													for (var i = 0; i < contador; i++) {
														arrHorario.shift();
													}
													var newFecha = that.getYYYYMMDD(new Date());
													that.oModel.setProperty("/DataConstanteFechaInicialPen", newFecha);
													arrcontador.push(contador)
													that.oModel.setProperty("/DataConstanteContadorRecuertoPen", arrcontador);
												}
												that.oModel.setProperty("/DataConstante", arrHorario);
												sap.ui.core.BusyIndicator.hide(0);
												that.getFilterTableFechaWhere(ejecucion);
											} else {
												var cant = arrHorario.length;
												const myObj = {}

												for (var i = 0, len = arrHorario.length; i < len; i++)
													myObj[arrHorario[i]['FECHAS']] = arrHorario[i].FECHAS;

												var arrHorario2 = new Array();
												for (var key in myObj)
													arrHorario2.push(myObj[key]);
												var contador2 = contador * (arrHorario2.length)
												if (contador == parseInt(dataHoraTrabajada[0].CONTADOR) && fecha_min != (fechavalidate)) {
													that.oModel.setProperty("/DataConstante", arrHorario);
													sap.ui.core.BusyIndicator.hide(0);
													that.getFilterTableFechaWhere(ejecucion);
												} else if (fecha_min == fechavalidate) {
													if (arrHorario.length < contador2) {
														contador = contador2 - arrHorario.length;
														that.oModel.setProperty("/sConstanteContadorPen", contador);
														arrcontador.push(contador)
														that.oModel.setProperty("/DataConstanteContadorRecuertoPen", arrcontador);
														var nuevaFecha = (arrHorario[0].FECHAS).split(".");
														var newdia = nuevaFecha[0];
														var newmes = nuevaFecha[1];
														var newanio = nuevaFecha[2];
														var newFecha = arrHorario[0].FECHAS;

														that.oModel.setProperty("/DataConstanteFechaInicialPen", newFecha);
														that._byId(that.frgIdFechaPlan + "--fecharangoInicialPlan").setValue(newFecha)
														that.getFilterConstant("MM", "SOLICITAR_CITA", "CENTRO", arrcontador, extra, ejecucion);
													} else {
														for (var i = 0; i < contador; i++) {
															arrHorario.shift();
														}
														that.oModel.setProperty("/DataConstante", arrHorario);
														sap.ui.core.BusyIndicator.hide(0);
														that.getFilterTableFechaWhere(ejecucion);
													}
												} else {
													for (var i = 0; i < contador; i++) {
														arrHorario.shift();
													}
													that.oModel.setProperty("/DataConstante", arrHorario);
													sap.ui.core.BusyIndicator.hide(0);
													that.getFilterTableFechaWhere(ejecucion);
												}
											}
										} else if (contador == parseInt(dataHoraTrabajada[0].CONTADOR) && fecha_min != (fechavalidate) && primero) {
											if (estatefecha) {
												contador = contador - arrHorario.length;
												that.oModel.setProperty("/sConstanteContadorPen", contador);
												arrcontador.push(contador)
												that.oModel.setProperty("/DataConstanteContadorRecuertoPen", arrcontador);
												var nuevaFecha = fecha_min

												var newFecha = new Date((new Date(fecha_min)).getTime() + (1 * 24 * 60 * 60 * 1000));
												newFecha = that.getYYYYMMDD(newFecha);

												that.oModel.setProperty("/DataConstanteFechaInicialPen", newFecha);
												that._byId(that.frgIdFechaPlan + "--fecharangoInicialPlan").setValue(newFecha)
												that.getFilterConstant("MM", "SOLICITAR_CITA", "HORARIO", arrcontador, extra, estatefecha, ejecucion);
											} else {
												that.oModel.setProperty("/DataConstante", arrHorario);
												sap.ui.core.BusyIndicator.hide(0);
												that.getFilterTableFechaWhere(ejecucion);
											}
										} else {
											contador = contador - arrHorario.length;
											that.oModel.setProperty("/sConstanteContadorPen", contador);
											arrcontador.push(contador)
											that.oModel.setProperty("/DataConstanteContadorRecuertoPen", arrcontador);
											var nuevaFecha = (fecha_min)

											var newFecha = new Date((new Date(nuevaFecha)).getTime() + (1 * 24 * 60 * 60 * 1000));
											newFecha = that.getYYYYMMDD(newFecha);

											that.oModel.setProperty("/DataConstanteFechaInicialPen", newFecha);
											that._byId(that.frgIdFechaPlan + "--fecharangoInicialPlan").setValue(newFecha)
											that.getFilterConstant("MM", "SOLICITAR_CITA", "HORARIO", arrcontador, extra, estatefecha, ejecucion);
										}
									} else {
										that._byId(that.frgIdFechaPlan + "--fecharangoInicialPlan").setEnabled(false);
										that._byId(that.frgIdFechaPlan + "--fecharangoFinalPlan").setEnabled(false);
										that.oModel.setProperty("/oFechasDisponibles", []);
										that.oModel.setProperty("/oFechasDisponiblesNoProg", []);
										utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorHorasTrabMayor0"));
										sap.ui.core.BusyIndicator.hide(0);
									}
								} else {
									that._byId(that.frgIdFechaPlan + "--fecharangoInicialPlan").setEnabled(false);
									that._byId(that.frgIdFechaPlan + "--fecharangoFinalPlan").setEnabled(false);
									that.oModel.setProperty("/oFechasDisponibles", []);
									that.oModel.setProperty("/oFechasDisponiblesNoProg", []);
									utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorHoraTrabajadas"));
									sap.ui.core.BusyIndicator.hide(0);
								}
							} else {
								that._byId(that.frgIdFechaPlan + "--fecharangoInicialPlan").setEnabled(false);
								that._byId(that.frgIdFechaPlan + "--fecharangoFinalPlan").setEnabled(false);
								that.oModel.setProperty("/oFechasDisponibles", []);
								that.oModel.setProperty("/oFechasDisponiblesNoProg", []);
								utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorHorarioCentro"));
								sap.ui.core.BusyIndicator.hide(0);
							}
						},
						error: function (message) {
							sap.ui.core.BusyIndicator.hide(0);
						}
					});
				});
			} else {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorRangoMenorFecha"));
				sap.ui.core.BusyIndicator.hide(0);
			}
		},
		getFilterTableFechaWhere: function (ejecucion) {
			var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
			var DataConstanteCentro = that.oModelGet.getProperty("/oCentro")
			var dataConsta = that.oModel.getProperty("/DataConstante");

			var fecha_max = that._byId(this.frgIdFechaPlan + "--fecharangoFinalPlan").getValue();
			var fecha_min = that._byId(this.frgIdFechaPlan + "--fecharangoInicialPlan").getValue();
			var oData = []
			DataConstanteCentro.forEach(function (value) {
				oData.push(value.CENTRO)
			});

			var sURL = "/hana/IPROVIDER_ENTREGA/REGISTRO_FECHA/RegistroFechaTotalFiltar.xsjs?fecha_min=" + this.reverseStringForParameter(
				fecha_min.replaceAll("/", "."), ".") + "&fecha_max=" + this.reverseStringForParameter(fecha_max.replaceAll("/", "."), ".");
			$.ajax({
				url: sURL,
				method: "POST",
				contentType: 'application/json',
				data: JSON.stringify(oData),
				success: function (data) {
					var arr = [];
					for (var i = 0; i < Object.keys(data).length; i++) {
						data[i].FECHA = (data[i].FECHA).split("T")[0]
						data[i].HORA = (data[i].HORA).split("T")[1].split(".")[0]
						arr.push(data[i]);
					}

					var totalEntregaRegistrados = 0;
					var totalProvRegistrados = 0;

					//Adicionar Proveedor
					var arrProveedor = [];
					var arrProv = [];
					for (var i = 0; i < dataConsta.length; i++) {
						var dateConst = that.formatosFilterDate(dataConsta[i].FECHAS, dataConsta[i].HORARIOS).getTime();
						dataConsta[i].STATUS = "No Disponible"
						totalEntregaRegistrados = 0;
						totalProvRegistrados = 0;
						arrProveedor = [];
						arrProv = [];
						for (var k = 0; k < arr.length; k++) {
							var dateFecha = new Date(arr[k].FECHA + " " + arr[k].HORA).getTime();
							if (dateConst === dateFecha) {
								var entRegistrada = parseInt(arr[k].ENTREGAS_REGISTRADAS)
								var provRegistrada = 1
								totalEntregaRegistrados += entRegistrada;
								arrProv.push(arr[k]);
							}
						}

						arrProveedor = arrProv;
						var cantProveedor = arrProveedor.length;
						const myObj2 = {};

						for (var l = 0, len = arrProveedor.length; l < len; l++)
							myObj2[arrProveedor[l]['PROVEEDOR']] = arrProveedor[l].PROVEEDOR;

						arrProveedor = new Array();
						for (var key2 in myObj2)
							arrProveedor.push(myObj2[key2]);

						totalProvRegistrados = arrProveedor.length;

						if (totalEntregaRegistrados < parseInt(dataConsta[i].NUMERO_ENTREGA)) {
							if (parseInt(dataConsta[i].PROVEEDORES) > totalProvRegistrados) {
								dataConsta[i].STATUS = "Disponible"
							} else {
								dataConsta[i].STATUS = "No Disponible"
							}
						} else {
							dataConsta[i].STATUS = "No Disponible"
						}

					}

					that.oModel.setProperty("/DataFecha", dataConsta);

					if (ejecucion) {
						timeOutFecha = setTimeout(
							function () {
								that.getFilterTableFechaWhere(true);
								console.log("timeOut");
							}, 1000);
					}
				},
				error: function (e) {
					if (ejecucion) {
						timeOutFecha = setTimeout(
							function () {
								that.getFilterTableFechaWhere(true);
								console.log("timeOut");
							}, 1000);
					}
				}
			});
		},
		cambioRangoInicialProg: function () {
			var rangoFecha = that.oModel.getProperty("/oRangoFecha");
			var contador = that.oModel.getProperty("/sConstanteContadorPen");
			var arrayOrdenesPendientes = that.oModel.getProperty('/oEntregaSelect');

			var fechas = [];
			var fecha_max;
			var fecha_min = rangoFecha[0];
			fecha_min = this.getYYYYMMDD(new Date(rangoFecha[0]));

			var fechaFinal = that._byId(this.frgIdFechaPlan + "--fecharangoFinalPlan").getValue();
			var fechaInicial2 = that.oModel.getProperty("/DataConstanteFechaInicialPen");
			var fechaInicial = fecha_min;

			var fechaInicialSplit = fechaInicial.split("/");
			var year0 = parseInt(fechaInicialSplit[0]);
			var mount0 = parseInt(fechaInicialSplit[1]);
			var day0 = parseInt(fechaInicialSplit[2]);
			that._byId(this.frgIdFechaPlan + "--fecharangoInicialPlan").setMinDate(new Date(year0, mount0 - 1, day0));

			if (fechaFinal != "") {
				var fechaFinalSplit = fechaFinal.split("/");
				var year = parseInt(fechaFinalSplit[0]);
				var mount = parseInt(fechaFinalSplit[1]);
				var day = parseInt(fechaFinalSplit[2]);
				that._byId(this.frgIdFechaPlan + "--fecharangoInicialPlan").setMaxDate(new Date(year, mount - 1, day - 1));
			}
		},
		eventchangeFechainicialProg: function (oEvent) {
			var contador = that.oModel.getProperty("/DataConstanteContadorRecuertoPen");
			var ConstanteHorarioValidate = that.oModel.getProperty("/oDataHorarioValidatePen");
			var fechaInicial3 = ConstanteHorarioValidate;
			var diaValidation3 = fechaInicial3.split("/")[2];
			var mesValidation3 = fechaInicial3.split("/")[1];
			var anioValidation3 = fechaInicial3.split("/")[0];

			var fechaInicial2 = that.oModel.getProperty("/DataConstanteFechaInicialPen");
			var diaValidation2 = fechaInicial2.split("/")[2];
			var mesValidation2 = fechaInicial2.split("/")[1];
			var anioValidation2 = fechaInicial2.split("/")[0];

			var fechaFinal = that._byId(this.frgIdFechaPlan + "--fecharangoFinalPlan").getValue();
			var fechaInicial = that._byId(this.frgIdFechaPlan + "--fecharangoInicialPlan").getValue();
			var dateActual = new Date();
			var anioActual = dateActual.getFullYear()
			var diaValidation = fechaInicial.split(".")[2];
			var mesValidation = fechaInicial.split(".")[1];
			var anioValidation = fechaInicial.split(".")[0];

			var anioFin = dateActual.getFullYear();
			var diaFinVal = fechaFinal.split(".")[2];
			var mesFinVal = fechaFinal.split(".")[1];
			var anioFinVal = fechaFinal.split(".")[0];
			if (fechaInicial == "") {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorNotDate"));
			} else {
				if (fechaFinal != "") {
					if (that.ValidateFormatDate(that.reverseStringForParameter(fechaInicial, "/"))) {
						if (that.ValidateFormatDate(that.reverseStringForParameter(fechaFinal, "/"))) {
							var fechaValidation = new Date(fechaInicial).getTime();
							var fechaValidation2 = new Date(fechaInicial2).getTime();
							var fechaValidation3 = new Date(ConstanteHorarioValidate).getTime();
							if (fechaValidation > fechaValidation2) {
								that.oModel.setProperty("/sConstanteContadorPen", parseInt(that.oModelGet.getProperty("/oHorasTrabajadas")[0].CONTADOR));
							} else if (fechaValidation == fechaValidation2) {
								if (contador.length > 1) {
									that.oModel.setProperty("/sConstanteContadorPen", contador[1]);
								} else {
									that.oModel.setProperty("/sConstanteContadorPen", contador[0]);
								}
							} else if (fechaValidation == fechaValidation3) {
								contador = [];
								that.oModel.setProperty("/sConstanteContadorPen", parseInt(that.oModelGet.getProperty("/oHorasTrabajadas")[0].CONTADOR));
							} else {
								contador.pop();
								if (contador.length > 0) {
									that.oModel.setProperty("/DataConstanteContadorPen", contador[0]);
								} else {
									that.oModel.setProperty("/DataConstanteContadorPen", parseInt(that.oModelGet.getProperty("/oHorasTrabajadas")[0].CONTADOR));
								}
							}
							this.getFilterConstantCentro("MM", "SOLICITAR_CITA", "CENTRO", contador, false);
						} else {
							utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorFormatIncorrect"));
						}
					} else {
						utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorFormatIncorrect"));
					}
				} else {
					if (that.ValidateFormatDate(that.reverseStringForParameter(fechaInicial, "/"))) {
						var fechaValidation = new Date(fechaInicial).getTime();
						var fechaValidation2 = new Date(fechaInicial2).getTime();
						var fechaValidation3 = new Date(ConstanteHorarioValidate).getTime();
						if (fechaValidation >= fechaValidation2) {
							if (fechaValidation > fechaValidation2) {
								that.oModel.setProperty("/sConstanteContadorPen", parseInt(that.oModelGet.getProperty("/oHorasTrabajadas")[0].CONTADOR));
							} else if (fechaValidation == fechaValidation2) {
								if (contador.length > 1) {
									that.oModel.setProperty("/sConstanteContadorPen", contador[1]);
								} else {
									that.oModel.setProperty("/sConstanteContadorPen", contador[0]);
								}
							} else if (fechaValidation == fechaValidation3) {
								contador = [];
								that.oModel.setProperty("/sConstanteContadorPen", parseInt(that.oModelGet.getProperty("/oHorasTrabajadas")[0].CONTADOR));
							} else {
								contador.pop();
								if (contador.length > 0) {
									that.oModel.setProperty("/sConstanteContadorPen", contador[0]);
								} else {
									that.oModel.setProperty("/sConstanteContadorPen", parseInt(that.oModelGet.getProperty("/oHorasTrabajadas")[0].CONTADOR));
								}
							}
							this.getFilterConstantCentro("MM", "SOLICITAR_CITA", "CENTRO", contador, false);
						} else {
							utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSelectDateEst") + fechaInicial2);
						}
					} else {
						utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorFormatIncorrect"));
					}
				}
			}
		},
		//valida onclick en campos
		ValidarCamposFecha: function (oEvent) {
			var table = that._byId(this.frgIdFechaPlan + "--tbRegistroDisponible");
			var indece = table.getSelectedIndex()
			var context = oEvent.getParameter("rowContext");
			var context2 = "/DataFecha/" + indece.toString();
			var Object;
			if (context != null) {
				var oIndex = oEvent.getParameter('rowIndex');
				var Selecciones = table.getSelectedIndices();
				Object = that.oModel.getProperty(context2);
				if (Object != undefined) {
					if (Selecciones.length == 0) {} else if (Selecciones.length == 1) {
						if (Object.STATUS != "Disponible") {
							utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorFechaNoDisp"));
							table.removeSelectionInterval(oIndex, oIndex);
						}
					} else {
						table.removeSelectionInterval(oIndex, oIndex);
					}
				} else {
					if (Selecciones.length == 0) {
						table.removeSelectionInterval(oIndex, oIndex);
					} else if (Selecciones.length == 1) {
						table.removeSelectionInterval(oIndex, oIndex);
					} else {
						table.removeSelectionInterval(oIndex, oIndex);
					}
				}
			}
		},
		_onPressContinuarCitaTemp: function () {
			var oIndeces = that._byId(that.frgIdFechaPlan + "--tbRegistroDisponible").getSelectedIndices();

			if (oIndeces.length === 0) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("lblSeleccionFechaBotonPlanificarCita"));
				return;
			}

			var sIndex = that._byId(that.frgIdFechaPlan + "--tbRegistroDisponible").getSelectedIndex().toString();
			var fecha = that.oModel.getProperty("/DataFecha/" + sIndex);
			
			var jEnvioFecha = {
				"FECHAS": fecha.FECHAS,
				"HORARIOS": fecha.HORARIOS,
				"NUMERO_ENTREGA": fecha.NUMERO_ENTREGA,
				"PROVEEDORES": fecha.PROVEEDORES,
				"STATUS": fecha.STATUS
			}

			clearTimeout(timeOutFecha);
			if (sTarget == "02") {
				sap.ui.core.BusyIndicator.show(0);
				that.newDialogGuiaTempConcurrencia(jEnvioFecha);
			}
		},
		newDialogGuiaTempConcurrencia: function (fecha) {
			var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");
			var arr = [];
			var arrProv = [];

			if (sTarget == "02") {} else if (sTarget == "03") {
				for (var i = 0; i < arrayOrdenes.length; i++) {
					if (arrayOrdenes[i].Zbolnr.substr(0, 2) == "09") {
						arrayOrdenes[i].Zbolnr = arrayOrdenes[i].Zbolnr.substr(3);
						arrayOrdenes[i].numGuia = arrayOrdenes[i].numGuia.substr(3);
					}
				}
			}
			that.oModel.setProperty("/fecha", fecha);

			var arrHorarioTotal = [];
			var obj = {};
			var condEntrega = arrayOrdenes[0].lugdestino;
			if (condEntrega == "03") {
				obj.TitleFecha = "Fecha de Recojo"
				obj.TitleHora = "Hora de Recojo"
			} else if (condEntrega == "02") {
				obj.TitleFecha = "Fecha de Llegada"
				obj.TitleHora = "Hora de Llegada"
			} else if (condEntrega == "01") {
				obj.TitleFecha = "Fecha Cita"
				obj.TitleHora = "Hora Cita"
			} else {
				obj.TitleFecha = "Fecha"
				obj.TitleHora = "Hora"
			}
			arrHorarioTotal.push(obj)

			that.oModel.setProperty("/DataFechaNoProg", arrHorarioTotal);

			var oDataCentro = that.oModelGet.getProperty("/oCentro");
			var arrCompleteCentro = [];

			var validatecentros = false;
			for (var i = 0; i < oDataCentro.length; i++) {
				for (var j = 0; j < arrayOrdenes.length; j++) {
					if (oDataCentro[i].CENTRO == arrayOrdenes[j].Werks) {
						validatecentros = true;
					}
				}
			}
			if (validatecentros) {
				for (var i = 0; i < oDataCentro.length; i++) {
					var obj = {};
					obj.Centro = oDataCentro[i].CENTRO;
					arrCompleteCentro.push(obj);
				}
			}

			for (var i = 0; i < arrayOrdenes.length; i++) {
				var obj = {};
				obj.Centro = arrayOrdenes[i].Werks;
				arrCompleteCentro.push(obj);
			}

			var arrCentro = [];
			arrCentro = arrCompleteCentro;
			var cant = arrCentro.length;
			const myObj = {}

			for (var i = 0, len = arrCentro.length; i < len; i++)
				myObj[arrCentro[i]['Centro']] = arrCentro[i].Centro;

			arrCentro = new Array();
			for (var key in myObj)
				arrCentro.push(myObj[key]);

			var arrCantCentro = [];
			for (var i = 0; i < arrCentro.length; i++) {
				var cantidadcentro = 0;
				var obj = {};
				obj.centro = arrCentro[i];
				for (var j = 0; j < arrayOrdenes.length; j++) {
					if (arrCentro[i] == arrayOrdenes[j].Werks) {
						cantidadcentro += 1;
						obj.numero = cantidadcentro;

					}
				}
				arrCantCentro.push(obj)
			}

			for (var i = 0; i < arrCantCentro.length; i++) {
				for (var j = 0; j < arrayOrdenes.length; j++) {
					if (arrCantCentro[i].centro == arrayOrdenes[j].Werks) {
						arrayOrdenes[j].ID_Eliminar = "";
						arrayOrdenes[j].Enviar = arrCantCentro[i].numero;
						arrayOrdenes[j].Centro = arrayOrdenes[i].Werks;
						arrayOrdenes[j].Proveedor = arrayOrdenes[i].Lifnr;
					}
				}
			}

			//Adicionar Proveedor
			var arrProveedor = [];
			arrProveedor = arrayOrdenes;
			var cantProveedor = arrProveedor.length;
			const myObj2 = {}

			for (var i = 0, len = arrProveedor.length; i < len; i++)
				myObj2[arrProveedor[i]['Proveedor']] = arrProveedor[i].Lifnr;

			arrProveedor = new Array();
			for (var key2 in myObj2)
				arrProveedor.push(myObj2[key2]);

			var arrCantProveedor = [];
			var arrProv = [];
			for (var i = 0; i < arrProveedor.length; i++) {
				var cantidadProveedor = 0;
				var objProveedor = {};
				objProveedor.PROVEEDOR = arrProveedor[i];
				for (var j = 0; j < arrayOrdenes.length; j++) {
					if (arrProveedor[i] == arrayOrdenes[j].Lifnr) {
						cantidadProveedor += 1;
						objProveedor.numero = cantidadProveedor;

					}
				}
				arrCantProveedor.push(objProveedor);
				arrProv.push(objProveedor);
			}
			if (sTarget == "02") {
				if (validateTipoFecha == "01") {
					var seleccionado = that._byId(this.frgIdFechaPlan + "--tbRegistroDisponible").getSelectedIndex();
					var contextActual = "/DataFecha/" + seleccionado.toString();
					var contextNuevo = "/DataFecha/" + (seleccionado + 1).toString();
					var actual = that.oModel.getProperty(contextActual);
					var jFechaActual = {
						"FECHAS": actual.FECHAS,
						"HORARIOS": actual.HORARIOS,
						"NUMERO_ENTREGA": actual.NUMERO_ENTREGA,
						"PROVEEDORES": actual.PROVEEDORES,
						"STATUS": actual.STATUS
					}
					var nuevo = that.oModel.getProperty(contextNuevo);
					var jFechaNuevo = {
						"FECHAS": nuevo.FECHAS,
						"HORARIOS": nuevo.HORARIOS,
						"NUMERO_ENTREGA": nuevo.NUMERO_ENTREGA,
						"PROVEEDORES": nuevo.PROVEEDORES,
						"STATUS": nuevo.STATUS
					}
					var horaactual = "";
					var horanueva = "";
					if (actual) {
						horaactual = actual.HORARIOS.split(":")[0];
					} else {
						horaactual = "";
					}
					if (nuevo) {
						horanueva = nuevo.HORARIOS.split(":")[0];
					} else {
						horanueva = "";
					}
					var oUserGeneral = that.oModelUser.getData();
					var jEnvioUser = {
						displayName: oUserGeneral.Resources[0].name.givenName,
						firstName: oUserGeneral.Resources[0].name.givenName,
						id: oUserGeneral.Resources[0].id,
						lastName: oUserGeneral.Resources[0].name.familyName,
						mail: oUserGeneral.oDataAditional[0].Smtp_addr,
						ruc: oUserGeneral.oDataAditional[0].Stcd1
					}
					that.oModelGet.setProperty("/oUserIng", jEnvioUser)
					fecha.FECHAS = that.reverseStringForParameter(fecha.FECHAS, "/").replaceAll("/", ".");
					jFechaActual.FECHAS = that.reverseStringForParameter(actual.FECHAS, "/").replaceAll("/", ".");
					if (nuevo) {
						jFechaNuevo.FECHAS = that.reverseStringForParameter(nuevo.FECHAS, "/").replaceAll("/", ".");
					}
					var objEnvio = {
						"oResults": {
							"arrayOrdenes": arrayOrdenes,
							"arrCentro": arrCentro,
							"arrCantCentro": arrCantCentro,
							"arrProveedor": arrProveedor,
							"arrCantProveedor": arrCantProveedor,
							"arrProv": arrProv,
							"target": sTarget,
							"arrayFechaDisponibles": fecha,
							"User": jEnvioUser,
							"fecha": fecha,
							"actual": jFechaActual,
							"nuevo": jFechaNuevo
						}
					}
					if (actual) {
						Services.ValidacionConcurrenciaFecha(that, objEnvio, function (result) {
							util.response.validateFunctionSingleEnd(result, {
								success: function (data, message) {
									that.oModel.setProperty("/dataConcurrencia", data);
									that.newEstructuraInsertFecha();
								},
								error: function (message) {
									that.getFilterTableFechaWhere(true);
								}
							});
						});
					} else {
						that.getFilterTableFechaWhere(true);
					}
				} else {
					that.abrirnewDialogGuiaTemp();
				}
			}
		},
		newEstructuraInsertFecha: function () {
			var cita = "";
			var dataConcurrencia = that.oModel.getProperty("/dataConcurrencia");

			var dataTotalERP = [];
			var dataTotalSCP = [];

			for (var i = 0; i < dataConcurrencia.length; i++) {
				var dataERP = [];
				var dataSCP = [];
				var dataOrdenesERP = [];
				var dataOrdenesSCP = [];
				var FechaDisponibles = dataConcurrencia[i].FechaDisponibles;
				var Ordenes = dataConcurrencia[i].Ordenes;

				for (var j = 0; j < Ordenes.length; j++) {
					if (Ordenes[j].codtipoData == "01") {
						dataOrdenesERP.push(Ordenes[j]);
					} else if (Ordenes[j].codtipoData == "02") {
						dataOrdenesSCP.push(Ordenes[j]);
					}
				}

				if (dataOrdenesERP.length > 0) {
					dataERP.Ordenes = dataOrdenesERP;
					dataERP.FechaDisponibles = FechaDisponibles;
					dataTotalERP.push(dataERP);
				}

				if (dataOrdenesSCP.length > 0) {
					dataSCP.Ordenes = dataOrdenesSCP;
					dataSCP.FechaDisponibles = FechaDisponibles;

					dataTotalSCP.push(dataSCP);
				}

			}

			var estructuraDataTotalERP = {};
			var estructuraDataTotalSCP = {};
			var estructuraDataConcurrencia = {};

			if (sTarget == "02") {
				if (dataConcurrencia[0].Ordenes[0].LugEntD === "01") { //cede campoy                
					if (validateTipoFecha == "01") {
						cita = that.generarCita();
					} else {
						cita = that.generarCita();
					}
				} else if (dataConcurrencia[0].Ordenes[0].LugEntD === "02") { //puesto en mina
					cita = "";
				} else {
					cita = "";
				}
			}

			if (dataTotalERP.length > 0) {
				estructuraDataTotalERP = this.EstructuraInsertFechaReturn(dataTotalERP, "POST", cita, sTarget, validateTipoFecha);
			}
			if (dataTotalSCP.length > 0) {
				estructuraDataTotalSCP = this.EstructuraInsertFechaReturn(dataTotalSCP, "POST", cita, sTarget, validateTipoFecha);
			}

			estructuraDataConcurrencia = this.EstructuraInsertFechaReturn(dataConcurrencia, "POST", cita, sTarget, validateTipoFecha);

			console.log("Estructura ERP:", estructuraDataTotalERP);
			console.log("Estructura SCP:", estructuraDataTotalSCP);
			console.log("Estructura Validation:", estructuraDataConcurrencia);

			if (sTarget == "02") {
				if (Object.keys(estructuraDataTotalERP).length > 0) {
					if (estructuraDataTotalSCP.arr2New != "") {
						that.methodPostXsjs(estructuraDataTotalERP.arr2New, "POST", estructuraDataTotalERP.arr3);
					}
					if (estructuraDataTotalSCP.arr2New != "") {
						that.methodPostXsjs(estructuraDataTotalSCP.arr2New, "POST", estructuraDataTotalSCP.arr3);
					}
					this.methodPostFlujoSap(dataOrdenesERP, dataOrdenesSCP, estructuraDataTotalERP, estructuraDataTotalSCP,
						estructuraDataConcurrencia, "/ERP/sap/opu/odata/sap/ZBVMM_WEB_OC_PLANIFICAR_ENT_SRV",
						"/ERP/sap/opu/odata/sap/ZBVMM_WEB_OC_PLANIFICAR_ENT_SRV/ZetPlanificarSet", "DialogSelecFechaProg", "1", cita);
				} else {
					if (estructuraDataTotalSCP.arr2New != "") {
						that.methodPostXsjs(estructuraDataTotalSCP.arr2New, "POST", estructuraDataTotalSCP.arr3);
					}
					this.methodPostHana(estructuraDataTotalSCP.arr4, cita);
				}
			}
		},
		methodPostFlujoSap: function (dataOrdenesERP, dataOrdenesSCP, contentERP, contentSCP, contentConcurrencia, urlGet, urlPost, Dialog,msg, cita) {
			var estatus = that.oModelGet.getProperty("/oEstado");
			var codigoestatus = estatus[4].Campo;
			var descestatus = estatus[4].DescripcionCampo;
			
			contentERP.objEnvioSap.ItemSet.forEach(function(x){
				x.Zzlfstk	= codigoestatus;
				x.Zcita = cita;
			});
			contentERP.objEnvioSap.user = that.getRuc();
			var data = {
				"oResults": contentERP.objEnvioSap
			};
 			Services.InsertarEntregasERPHana(this, data, function (result) {
				util.response.validateAjaxGetHana(result, {
					success: function (oData, message) {
						console.log(oData);
						var LISTA_GENERAL = oData.oResults;
						that.oModel.setProperty("/LISTA_GENERAL_ERP",LISTA_GENERAL);
						var cita = LISTA_GENERAL[0].Zcita;
						if (Object.keys(contentSCP).length > 0) {
							that.methodPostHana(contentSCP.arr4, cita);
						}else{
							that.generatePdfWithQr(that, LISTA_GENERAL, cita);
						}
					},
					error: function (message) {
						sap.ui.core.BusyIndicator.hide(0);
					}
				});
			});
 					
 		},
		methodPostHana: function (content, cita) {
			var data = {
				"oResults": content
			};

			Services.InsertarEntregasHana(this, data, function (result) {
				util.response.validateAjaxGetHana(result, {
					success: function (oData, message) {
						console.log(oData);
						var LISTA_GENERAL = oData.oResults.oData.oData.CitaEntrega;
						var LISTA_GENERAL_ERP = that.oModel.getProperty("/LISTA_GENERAL_ERP");
						if (LISTA_GENERAL_ERP.length > 0) {
							for (var i = 0; i < LISTA_GENERAL_ERP.length; i++) {
								LISTA_GENERAL.push(LISTA_GENERAL_ERP[i]);
							}
						}
						var cita = LISTA_GENERAL[0].Zcita;
						that.generatePdfWithQr(that, LISTA_GENERAL, cita);
					},
					error: function (message) {
						sap.ui.core.BusyIndicator.hide(0);
					}
				});
			});
		},
		methodPostXsjs: function (content, methodo, contentDelete) {

			var objEnvio = {
				"oResults": {
					"content": content,
					"methodo": methodo,
					"contentDelete": contentDelete,
					"target": sTarget,
					"User": that.oModelGet.getProperty("/oUserIng")
				}
			}

			Services.RegistrarEntregasAprobadas(that, objEnvio, function (result) {
				util.response.validateFunctionSingleEnd(result, {
					success: function (data, message) {
						console.log(data)
					},
					error: function (message) {
						console.log(message);
						MessageToast.show("Erro al añadir registro");

					}
				});
			});

			if (sTarget == "03") {
				this.BuscarDeleteXsjs(contentDelete);
			}

		},
		generatePdfWithQr: function (context, listaGeneral, cita) {
			var that = this;
			if (sTarget == '02') {
				that.saveCitaHanaScp(context, listaGeneral, cita);
			}
		},
		saveCitaHanaScp: function (context, listaGeneral, cita) {
			var obj = {
				ID_CITA: cita.toString()
			};
			console.log(listaGeneral);
			if (cita != "") {
				if (validateTipoFecha == "01") {
					that.exitopdf(context, "Se ha generado el número de cita " + cita, cita, listaGeneral, 1);
				} else {
					that.exitopdf(context,
						"Se registró la solicitud de cita no programada, una vez sea aprobada podrá visualizar el número en la pestaña “Citas y entregas” para que descargue los QR.",
						cita, listaGeneral, 1);
				}
			} else {
				var text = [];
				for (var i = 0; i < listaGeneral.length; i++) {
					text.push(this.formatInteger(listaGeneral[i].Zvbeln));
				}

				let result = text.filter((item, index) => {
					return text.indexOf(item) === index;
				})

				if (listaGeneral[0].ZzlugEnt == "03") {
					that.exitopdf(context, "Se ha planificado el recojo de la entrega: " + result.join(), cita, listaGeneral, 1);
				} else {
					that.exitopdf(context, "Se han actualizado la(s) Entrega(s)", cita, listaGeneral, 1);
				}

			}
		},
		exitopdf: function (context, msj, cita, listaGeneral, validate) {
			that.entregas = [];

			if (validate == 1) {
				sap.m.MessageBox.success(msj, {
					title: "Mensaje de éxito",
					actions: ["OK"],
					onClose: function (sActionClicked) {
						if (sActionClicked === "OK") {
							if (context.byId("DialogMant") != undefined) {
								context.byId("DialogMant").close();
							}
							if (context.byId("DialogConfirmarCentro") != undefined) {
								context.byId("DialogConfirmarCentro").close();
							}
							if (context.byId("DialogEntregasTemp") != undefined) {
								context.byId("DialogEntregasTemp").close();
							}
							if (context.byId("DialogSelecFechaProg") != undefined) {
								context.byId("DialogSelecFechaProg").close();
							}
							if (context.byId("DialogSelecFechaNoProgTemp") != undefined) {
								context.byId("DialogSelecFechaNoProgTemp").close();
							}

							var oView = context.getView();

							// var data = that.getData();
							var data = [];
							listaGeneral.forEach(function (value, index) {
								value.Zvemng = that.currencyFormat(value.Zvemng);
								data.push(value);
							});
							console.log("Lado de Kassiel para PDF");
							console.log(listaGeneral);
							console.log(data);
							if (data.length === 0) {
								sap.ui.core.BusyIndicator.hide(0);
								return;
							}
							var Entregas = [];
							var cantidad = data.length;

							while (cantidad !== 0) {
								var data1 = data[0];
								var arrayCoincidencias = [];
								var a = 1;
								for (a = 1; a < data.length; a++) {
									if (data1.Zvbeln === data[a].Zvbeln) {
										arrayCoincidencias.push(data[a]);
										cantidad--;
										data.splice(a, 1);
										a--;
									}
								}
								arrayCoincidencias.push(data[0]);
								data.splice(0, 1);

								cantidad--;

								var nBultos = arrayCoincidencias[0].Zanzpk;
								var cita = arrayCoincidencias[0].Zcita;
								var sociedad = arrayCoincidencias[0].Zbukrs;
								var entrega = that.formatInteger(arrayCoincidencias[0].Zvbeln);
								var proveedor = arrayCoincidencias[0].Zname1;
								var destino = arrayCoincidencias[0].Zlgobe;

								var guia = arrayCoincidencias[0].Zbolnr;
								var numeroTotalBultos = (arrayCoincidencias[0].Zanzpk) * 1;
								var condEnt = arrayCoincidencias[0].Zdesc_cond;
								var codcondEnt = arrayCoincidencias[0].ZzlugEnt;
								var direccion = arrayCoincidencias[0].Zdireccion;
								var fecha = that.formaterxTemp(arrayCoincidencias[0].Zlfdat);
								var horaAbap = arrayCoincidencias[0].Zlfuhr;
								var nombreCompleto = arrayCoincidencias[0].nombreCompleto;
								var nombreCompleto2 = arrayCoincidencias[0].nombreCompleto2;
								var nombreCompleto3 = arrayCoincidencias[0].nombreCompleto3;
								var nombreCompleto4 = arrayCoincidencias[0].nombreCompleto4;
								var ID_ENTREGA_SIN_OC_CABECERA = arrayCoincidencias[0].ID_ENTREGA_SIN_OC_CABECERA;
								var EMAIL_DESTINATARIO_FINAL = arrayCoincidencias[0].EMAIL_DESTINATARIO_FINAL;
								var DESCRIPCION_MOTIVOS = arrayCoincidencias[0].DESCRIPCION_MOTIVOS;

								var hora;
								if (validateTipoFecha == "01") {
									if (that.formatHourTemp(arrayCoincidencias[0].Zlfuhr) == "00:00") {
										hora = that.formatHourTemp(arrayCoincidencias[0].Zlfuhr);
									} else {
										hora = that.formatHour2Temp(arrayCoincidencias[0].Zlfuhr);
									}
								} else if (validateTipoFecha == "") {
									if (arrayCoincidencias[0].Zcita_np == "NO PROGRAMADA" || arrayCoincidencias[0].Zcita_np == "NO PROGRAMADO") {
										hora = that.formatHourTemp(arrayCoincidencias[0].Zlfuhr);
									} else {
										hora = that.formatHour2Temp(arrayCoincidencias[0].Zlfuhr);
									}
								} else {
									hora = that.formatHourTemp(arrayCoincidencias[0].Zlfuhr);
								}
								var zona = arrayCoincidencias[0].Zzona;
								var pesoTotBultos = that.currencyFormat(arrayCoincidencias[0].Zbtgew);
								var dni = arrayCoincidencias[0].Zdni;
								var dni2 = arrayCoincidencias[0].Zdni2;
								var dni3 = arrayCoincidencias[0].Zdni3;
								var dni4 = arrayCoincidencias[0].Zdni4;
								var placa = arrayCoincidencias[0].Zplaca;
								var placa2 = arrayCoincidencias[0].Zplaca2;
								var placa3 = arrayCoincidencias[0].Zplaca3;
								var placa4 = arrayCoincidencias[0].Zplaca4;

								var almacen = arrayCoincidencias[0].Zlgobe;
								var cantidadEmbalaje = parseInt(arrayCoincidencias[0].Zanzpk);

								var Bultos = [];
								var CantidadEntregas = arrayCoincidencias.length;
								while (CantidadEntregas !== 0) {
									var dataEntregas = arrayCoincidencias[0];
									var arrayBultos = [];
									var e = 1;
									for (e; e < arrayCoincidencias.length; e++) {
										if (dataEntregas.ZvhilmKu === arrayCoincidencias[e].ZvhilmKu) {
											arrayBultos.push(arrayCoincidencias[e]);
											CantidadEntregas--;
											arrayCoincidencias.splice(e, 1);
											e--;
										}
									}
									arrayBultos.push(arrayCoincidencias[0]);
									arrayCoincidencias.splice(0, 1);

									CantidadEntregas--;

									var BultoCodigo = arrayBultos[0].ZvhilmKu;
									var PesoBulto = that.currencyFormat(arrayBultos[0].ZbrgewB);
									var codigo = arrayBultos[0].Zbezei;
									var descipcion = that.formatNoDecimal(parseFloat(arrayBultos[0].Zlaeng).toFixed(2)) + "x" +
										that.formatNoDecimal(parseFloat(arrayBultos[0].Zbreit).toFixed(2)) + "x" +
										that.formatNoDecimal(parseFloat(arrayBultos[0].Zhoehe).toFixed(2))
										.toString();
									var CantidadEmbalajeBulto = parseInt(arrayBultos[0].ZvhilmKu);
									var Zet_emb_complSet = arrayBultos[0].Zet_emb_complSet.results;
									var Un_map = ''
									if (arrayBultos[0].Exidv) {
										Un_map = (arrayBultos[0].Exidv * 1).toString();
									}

									var ArrayComplementario = [];
									if (Zet_emb_complSet) {
										Zet_emb_complSet.forEach(function (values) {
											if (values.VHILM_KU == BultoCodigo) {
												ArrayComplementario.push(values);
											}
										});
									}

									var dataBultos = {
										Descipcion: descipcion,
										Codigo: codigo,
										CantidadEmbalajeBulto: CantidadEmbalajeBulto,
										PesoBult: PesoBulto,
										DescripcionGeneral: BultoCodigo,
										Un_map: Un_map,
										ArrayComplementario: ArrayComplementario,
										ArrayGeneral: arrayBultos
									};

									Bultos.push(dataBultos);

								}

								var DataEntregas = {
									cita: cita,
									ID_ENTREGA_SIN_OC_CABECERA: ID_ENTREGA_SIN_OC_CABECERA,
									EMAIL_DESTINATARIO_FINAL: EMAIL_DESTINATARIO_FINAL,
									DESCRIPCION_MOTIVOS: DESCRIPCION_MOTIVOS,
									sociedad: sociedad,
									entrega: entrega,
									almacen: almacen,
									proveedor: proveedor,
									cantidadEmbalaje: cantidadEmbalaje,
									destino: destino,
									guia: guia,
									numeroTotalBultos: numeroTotalBultos,
									condEnt: condEnt,
									codcondEnt: codcondEnt,
									direccion: direccion,
									fecha: fecha,
									hora: hora,
									zona: zona,
									pesoTotBultos: pesoTotBultos,
									bultos: nBultos,
									dni: dni,
									dni2: dni2,
									dni3: dni3,
									dni4: dni4,
									placa: placa,
									placa2: placa2,
									placa3: placa3,
									placa4: placa4,
									nombreCompleto: nombreCompleto,
									nombreCompleto2: nombreCompleto2,
									nombreCompleto3: nombreCompleto3,
									nombreCompleto4: nombreCompleto4,
									horaAbap: horaAbap,
									ArrayGeneral: Bultos
								};
								Entregas.push(DataEntregas);
								that.entregas.push(DataEntregas);
							}
							var EntregasOrdenada = that.ordenarEntrega(Entregas);
							var Data = {
								ArrayGeneral: EntregasOrdenada
							};

							var arrtext = [];
							var cantidad = Data.ArrayGeneral.length
							for (var i = 0; i < Data.ArrayGeneral.length; i++) {
								if (cantidad == 1) {
									arrtext += Data.ArrayGeneral[i].entrega
								} else {
									arrtext += Data.ArrayGeneral[i].entrega + "-"
								}
								cantidad--;
							}
							var logo = "";
							
							that.abriDialog(Data, logo, arrtext);
						}
					}

				});
			}
		},
		abriDialog: function (Data, logo, arrtext) {
			var oView = that.getView();

			if (!oView.byId("DialogFormatQR")) {
				Fragment.load({
					id: oView.getId(),
					name: "solicitarcitapr.view.dialogs.FormatQR",
					controller: that
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					that.onPdfFormat(Data, logo, arrtext);
					var qrCitaTotal = that.oModel.getProperty("/DataqrCitaTotal");
					var arrCitaTotal = that.oModel.getProperty("/DataarrCitaTotal");
					var arrCita = that.oModel.getProperty("/DataarrCita");
					var arrQrBultos = that.oModel.getProperty("/DataarrQrBultos");
					var arrQrBultosComplementario = that.oModel.getProperty("/DataarrQrBultosComplementario");
					oDialog.open();

					// cita
					if (Data.ArrayGeneral[0].cita) {
						var textQRCitaTotal = arrCita[0].cita
						qrcode = new QRCode(document.getElementById(qrCitaTotal), {
							text: textQRCitaTotal, //ESTE ES EL TEXTO SE CONVERTIRA EL EL CODIGO QR 
							width: "120",
							height: "120",
							colorDark: "#000000",
							colorLight: "#ffffff",
							correctLevel: QRCode.CorrectLevel.H
						});
					}
					// cita
					//PDF DETALLADOS
					for (var i = 0; i < arrCita.length; i++) {

						var textQREntrega = arrCita[i].entrega + "|" + arrCita[i].nbultos + "|" + arrCita[i].condEnt + "|" + arrCita[i].almacen

						qrcode = new QRCode(document.getElementById(arrCita[i].qrentrega), {
							text: textQREntrega, //ESTE ES EL TEXTO SE CONVERTIRA EL EL CODIGO QR 
							width: "110",
							height: "110",
							colorDark: "#000000",
							colorLight: "#ffffff",
							correctLevel: QRCode.CorrectLevel.H
						});
					}

					for (var i = 0; i < arrQrBultos.length; i++) {
						var textQRBulto = (arrQrBultos[i].Un_map * 1).toString();
						qrcode = new QRCode(document.getElementById(arrQrBultos[i].qrBultos), {
							text: textQRBulto, //ESTE ES EL TEXTO SE CONVERTIRA EL EL CODIGO QR 
							width: "80",
							height: "80",
							colorDark: "#000000",
							colorLight: "#ffffff",
							correctLevel: QRCode.CorrectLevel.H
						});
					}

					for (var i = 0; i < arrQrBultosComplementario.length; i++) {
						var textQRBultoComplementario = (arrQrBultosComplementario[i].Un_map * 1).toString() + "-" + arrQrBultosComplementario[i].bultoComplementario;
						qrcode = new QRCode(document.getElementById(arrQrBultosComplementario[i].qrBultosComplementario), {
							text: textQRBultoComplementario,
							width: "80",
							height: "80",
							colorDark: "#000000",
							colorLight: "#ffffff",
							correctLevel: QRCode.CorrectLevel.H
						});
					}

					//enviar al onBase
					that.GetSendOnbaseCitaEntrega("no");
					//enviar al onBase

				});
			} else {
				that.onPdfFormat(Data, logo, arrtext);
				var qrCitaTotal = that.oModel.getProperty("/DataqrCitaTotal");
				var arrCitaTotal = that.oModel.getProperty("/DataarrCitaTotal");
				var arrCita = that.oModel.getProperty("/DataarrCita");
				var arrQrBultos = that.oModel.getProperty("/DataarrQrBultos");
				var arrQrBultosComplementario = that.oModel.getProperty("/DataarrQrBultosComplementario");
				oView.byId("DialogFormatQR").open();

				// cita
				if (Data.ArrayGeneral[0].cita) {

					var textQRCitaTotal = arrCita[0].cita
					qrcode = new QRCode(document.getElementById(qrCitaTotal), {
						text: textQRCitaTotal, //ESTE ES EL TEXTO SE CONVERTIRA EL EL CODIGO QR 
						width: "120",
						height: "120",
						colorDark: "#000000",
						colorLight: "#ffffff",
						correctLevel: QRCode.CorrectLevel.H
					});
				}

				//PDF DETALLADOS
				for (var i = 0; i < arrCita.length; i++) {

					var textQREntrega = arrCita[i].entrega + "|" + arrCita[i].nbultos + "|" + arrCita[i].condEnt + "|" + arrCita[i].almacen

					qrcode = new QRCode(document.getElementById(arrCita[i].qrentrega), {
						text: textQREntrega, //ESTE ES EL TEXTO SE CONVERTIRA EL EL CODIGO QR 
						width: "110",
						height: "110",
						colorDark: "#000000",
						colorLight: "#ffffff",
						correctLevel: QRCode.CorrectLevel.H
					});
				}

				for (var i = 0; i < arrQrBultos.length; i++) {
					var textQRBulto = (arrQrBultos[i].Un_map * 1).toString();
					qrcode = new QRCode(document.getElementById(arrQrBultos[i].qrBultos), {
						text: textQRBulto, //ESTE ES EL TEXTO SE CONVERTIRA EL EL CODIGO QR 
						width: "80",
						height: "80",
						colorDark: "#000000",
						colorLight: "#ffffff",
						correctLevel: QRCode.CorrectLevel.H
					});
				}

				for (var i = 0; i < arrQrBultosComplementario.length; i++) {
					var textQRBultoComplementario = (arrQrBultosComplementario[i].Un_map * 1).toString() + "-" + arrQrBultosComplementario[i].bultoComplementario;
					qrcode = new QRCode(document.getElementById(arrQrBultosComplementario[i].qrBultosComplementario), {
						text: textQRBultoComplementario,
						width: "80",
						height: "80",
						colorDark: "#000000",
						colorLight: "#ffffff",
						correctLevel: QRCode.CorrectLevel.H
					});
				}

				//enviar al onBase
				that.GetSendOnbaseCitaEntrega("no");
				//enviar al onBase
			}
		},
		onPdfFormat: function (Data, logo, arrtext) {
			var that = this;
			var oView = that.getView();

			var textoPlacas = "";
			var textoDocumentos = "";
			var arrHorasAsignadas = [];
			var arrEntregasSCP = [];
			var arrEntregasERP = [];
			for (var i = 0; i < Data.ArrayGeneral.length; i++) {
				if (i == 0) {
					if (Data.ArrayGeneral[i].placa) {
						textoPlacas += Data.ArrayGeneral[i].placa;
					}
					if (Data.ArrayGeneral[i].placa2) {
						textoPlacas += ";" + Data.ArrayGeneral[i].placa2;
					}
					if (Data.ArrayGeneral[i].placa3) {
						textoPlacas += ";" + Data.ArrayGeneral[i].placa3;
					}
					if (Data.ArrayGeneral[i].placa4) {
						textoPlacas += ";" + Data.ArrayGeneral[i].placa4;
					}

					if (Data.ArrayGeneral[i].nombreCompleto) {
						textoDocumentos += '-' + Data.ArrayGeneral[i].nombreCompleto + "<br>";
					}
					if (Data.ArrayGeneral[i].nombreCompleto2) {
						textoDocumentos += '-' + Data.ArrayGeneral[i].nombreCompleto2 + "<br>";
					}
					if (Data.ArrayGeneral[i].nombreCompleto3) {
						textoDocumentos += '-' + Data.ArrayGeneral[i].nombreCompleto3 + "<br>";
					}
					if (Data.ArrayGeneral[i].nombreCompleto4) {
						textoDocumentos += '-' + Data.ArrayGeneral[i].nombreCompleto4 + "<br>";
					}
				}
				if (Data.ArrayGeneral[i].ID_ENTREGA_SIN_OC_CABECERA) {
					arrEntregasSCP.push(Data.ArrayGeneral[i]);
				} else {
					arrEntregasERP.push(Data.ArrayGeneral[i]);
				}

				arrHorasAsignadas.push(Data.ArrayGeneral[i].horaAbap);
			}

			if (Data.ArrayGeneral[0].codcondEnt == "01") {
				var VBoxPrincipalCita = new sap.m.VBox({
					width: "720px"
				});
				VBoxPrincipalCita.addStyleClass("VBoxPrincipal sapUiSizeCompact");
				var VBoxPrincipalCita2 = new sap.m.VBox({
					alignItems: "Center"
				});
				var hcita2 = '<h4 style="text-align: center;">Resumen de Cita</h4>';
				var titleCita = new sap.ui.core.HTML({});
				titleCita.setContent(hcita2);
				VBoxPrincipalCita2.addItem(titleCita);

				var qrCitaTotal2 = '<div style="text-align: center;"></div>'
				var qrCitaTotal2Html = new sap.ui.core.HTML({});
				qrCitaTotal2Html.setContent(qrCitaTotal2);

				var idCitaTotal = Data.ArrayGeneral[0].cita;
				var condEntrega = Data.ArrayGeneral[0].condEnt;

				var titlqQrCitaTotalHtml = new sap.ui.core.HTML({
					content: '<h4 style="text-align: center;font-weight:normal;">Condición de Entrega: ' +
						'<font size=6 style="font-weight:bold;">' + condEntrega + '</font>' +
						' </h4>'
				});

				var HBoxQRTotal = new sap.m.HBox({
					width: "100%",
					justifyContent: "Center"
				});
				var HBoxQRTotal2 = new sap.m.HBox({
					width: "100%",
					justifyContent: "Center",
					alignItems: "Center",
					height: "3rem"
				});
				HBoxQRTotal2.addItem(titlqQrCitaTotalHtml);

				HBoxQRTotal.addItem(HBoxQRTotal2);

				var VBoxQRTotal = new sap.m.VBox({
					width: "100%",
					alignItems: "Center"
				})
				VBoxQRTotal.addItem(HBoxQRTotal);

				VBoxQRTotal.addItem(qrCitaTotal2Html);
				VBoxPrincipalCita2.addItem(VBoxQRTotal);

				var resumenHtml = new sap.ui.core.HTML({
					content: '<h4 style="text-align: Start;font-weight:normal;">*Este documento se debe presentar en la garita de acceso al almacén</h4>'
				});

				var HBoxQRTotalDetalleCita = new sap.m.HBox({
					width: "100%",
					justifyContent: "Start",
					alignItems: "Center",
					height: "3rem"
				});
				HBoxQRTotalDetalleCita.addItem(resumenHtml);
				VBoxPrincipalCita2.addItem(HBoxQRTotalDetalleCita);
				that.oModel.setProperty("/DataqrCitaTotal", qrCitaTotal2Html.getId());

				var TablaCitaVBox = new sap.m.VBox({
					width: "100%"
				});
				var TablaCitaHtml = new sap.ui.core.HTML({});

				var direccionCita = Data.ArrayGeneral[0].direccion;
				var fechaCita = Data.ArrayGeneral[0].fecha;
				var idCitaCita = Data.ArrayGeneral[0].cita;

				var horaMinima = Math.min(...arrHorasAsignadas).toString();
				if (horaMinima.length == 5) {
					horaMinima = "0" + horaMinima;
				}
				
				let arrMatriz = [];
				arrMatriz = arrHorasAsignadas;
				let cantProveedor = arrMatriz.length;
				const myObj2 = {}
				for (let i = 0, len = arrMatriz.length; i < len; i++)
				    myObj2[arrMatriz[i]] = arrMatriz[i];
				arrMatriz = new Array();
				for (let key2 in myObj2)
				    arrMatriz.push(myObj2[key2]);
				
				var horaCita = "";
				if(arrMatriz.length == 1){
					horaCita = that.formatHourTemp(horaMinima);
				}else{
					horaCita = that.formatHourTemp(horaMinima) + "-" + that.formatHourTemp(arrMatriz[1]) ;
				}

				var htmlTablaCita = '<table style="border: 1px solid black; border-collapse: collapse; width: 100%;" align="center">' +
					'<thead>' +
					'<tr>' +
					'<td style="border: 1px solid black; border-collapse: collapse;" colspan="4" width="100%" height="18px">Proovedor: ' + Data.ArrayGeneral[
						0].proveedor + '</td>' +
					'</tr>' +
					'</thead>' +
					'<tbody>' +
					'<tr>' +
					'<td style="border: 1px solid black; border-collapse: collapse;text-align:center;" width="14%" height="18px">Nº Cita</td>' +
					'<td style="border: 1px solid black; border-collapse: collapse;" width="37%" height="18px">Dirección de Entrega</td>' +
					'<td style="border: 1px solid black; border-collapse: collapse;text-align:center;" width="auto" height="18px">Fecha y hora</td>' +
					'<td style="border: 1px solid black; border-collapse: collapse;text-align:center;" width="33%" height="18px">Vehículo</td>' +
					'</tr>' +
					'<tr>' +
					'<td style="border: 1px solid black; border-collapse: collapse;text-align:center;font-size:35px;" height="72px" rowspan="4">' +
					idCitaCita + '</td>' +
					'<td style="border: 1px solid black; border-collapse: collapse;font-size: 14px;" height="72px" rowspan = "4">' + direccionCita +
					'</td>' +
					'<td style="border: 1px solid black; border-collapse: collapse;font-size: 15px;" height="36px" rowspan = "2">' + fechaCita +
					'</td>' +
					'<td style="border: 1px solid black; border-collapse: collapse;font-size: 15px;" height="18px" >' + textoPlacas + '</td>' +
					'</tr>' +
					'<tr>' +
					'<td style="border: 1px solid black; border-collapse: collapse;" height="18px">Nombres  y Apellidos</td>' +
					'</tr>' +
					'<tr>' +
					'<td style="border: 1px solid black; border-collapse: collapse;font-size: 15px;" height="36px" >' + horaCita + '</td>' +
					'<td style="border: 1px solid black; border-collapse: collapse;font-size: 13px;" height="36px">' + textoDocumentos + '</td>' +
					'</tr>' +
					'</tbody>' +
					'</table>';
				TablaCitaHtml.setContent(htmlTablaCita);
				TablaCitaVBox.addItem(TablaCitaHtml);
				VBoxPrincipalCita2.addItem(TablaCitaVBox);

				var resumenEntregasHtml = new sap.ui.core.HTML({
					content: '<h4 style="text-align: Start;font-weight:normal;">*Una guía de remisión hace referencia unicamente a una entrega</h4>'
				});
				var HBoxResumenEntregasHtml = new sap.m.HBox({
					width: "100%",
					justifyContent: "Start",
					alignItems: "Center",
					height: "2rem"
				});
				HBoxResumenEntregasHtml.addItem(resumenEntregasHtml);
				VBoxPrincipalCita2.addItem(HBoxResumenEntregasHtml);

				var arrCitaTotal = [];
				var entregasERPDetalle = "";
				for (var i = 0; i < arrEntregasERP.length; i++) {
					var numeroEntregaERP = arrEntregasERP[i].entrega;
					var destinoEntregaERP = arrEntregasERP[i].destino;
					var pesoTotalbultosCitaERP = that.currencyFormat(arrEntregasERP[i].pesoTotBultos);
					var guiaEntregaERP = "";
					if (arrEntregasERP[i].guia.substr(0, 3) == "09-") {
						guiaEntregaERP = arrEntregasERP[i].guia.substr(3);
					} else {
						guiaEntregaERP = arrEntregasERP[i].guia;
					}
					var numeroTotalbultosCitaERP = that.currencyFormat(arrEntregasERP[i].numeroTotalBultos.toString());

					entregasERPDetalle += '<tr>' +
						'<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:center;font-size: 14px;" >' +
						numeroEntregaERP +
						'</td>' +
						'<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:center;font-size: 14px;">' +
						destinoEntregaERP +
						'</td>' +
						'<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:right;font-size: 14px;">' +
						pesoTotalbultosCitaERP +
						'</td>' +
						// '<td height="18px" style="border:1px solid black;border-collapse:collapse;font-size: 14px;">' +
						// guiaEntregaERP +
						// '</td>' +
						'<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:right;font-size: 14px;">' +
						numeroTotalbultosCitaERP +
						'</td>' +
						'</tr>';
				}
				if (arrEntregasERP.length > 0) {
					var titleCitaERPHtml = new sap.ui.core.HTML({
						content: '<h4 style="text-align: start;" >Resumen de Entregas: </h4>'
					});
					var VBoxTitleCitaERPHtml = new sap.m.VBox({
						width: "100%",
						justifyContent: "Center",
						alignItems: "Start",
						height: "1.5rem"
					});
					VBoxTitleCitaERPHtml.addItem(titleCitaERPHtml);
					VBoxPrincipalCita2.addItem(VBoxTitleCitaERPHtml);

					var oTableERP = "";
					oTableERP = '<table style="border: 1px solid black; border-collapse: collapse; width: 100%;" align="center">' +
						'<thead>' +
						'<tr>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="18%" >Entrega</td>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="23%">Destino</td>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="auto">Peso Total <br> (KG)</td>' +
						// '<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="23%">Guia de remisión</td>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="18%">Cantidad de Embalajes</td>' +
						'</tr>' +
						'</thead>' +
						'<tbody>' +
						entregasERPDetalle +
						'</tbody>' +
						'</table><br>';

					var oTableERPHTML = new sap.ui.core.HTML({
						content: oTableERP
					});

					var VBoxEntregaCitaERPHtml = new sap.m.VBox({
						width: "100%",
						justifyContent: "Center",
						alignItems: "Stretch",
					});
					VBoxEntregaCitaERPHtml.addItem(oTableERPHTML);
					VBoxPrincipalCita2.addItem(VBoxEntregaCitaERPHtml);
				}

				var entregasSCPDetalle = "";
				for (var i = 0; i < arrEntregasSCP.length; i++) {
					var numeroEntregaSCP = arrEntregasSCP[i].entrega;
					var descMotivosSCP = arrEntregasSCP[i].DESCRIPCION_MOTIVOS === undefined ? "" : arrEntregasSCP[i].DESCRIPCION_MOTIVOS;
					var correoSCP = arrEntregasSCP[i].EMAIL_DESTINATARIO_FINAL === undefined ? "" : arrEntregasSCP[i].EMAIL_DESTINATARIO_FINAL;
					var destinoEntregaSCP = arrEntregasSCP[i].destino;
					var pesoTotalbultosCitaSCP = that.currencyFormat(arrEntregasSCP[i].pesoTotBultos);
					var numeroTotalbultosCitaSCP = that.currencyFormat(arrEntregasSCP[i].numeroTotalBultos.toString());

					var guiaEntregaSCP = "";
					if (arrEntregasSCP[i].guia.substr(0, 3) == "09-") {
						guiaEntregaSCP = arrEntregasSCP[i].guia.substr(3);
					} else {
						guiaEntregaSCP = arrEntregasSCP[i].guia;
					}

					entregasSCPDetalle += '<tr>' +
						'<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:center;font-size: 14px;" >' +
						descMotivosSCP +
						'</td>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;font-size: 13px;" >' +
						numeroEntregaSCP + '<br>' + correoSCP +
						'</td>' +
						'<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:center;font-size: 14px;">' +
						destinoEntregaSCP +
						'</td>' +
						'<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:right;font-size: 14px;">' +
						pesoTotalbultosCitaSCP +
						'</td>' +
						// '<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:center;font-size: 14px;">' +
						// guiaEntregaSCP +
						// '</td>' +
						'<td height="18px" style="border:1px solid black;border-collapse:collapse;text-align:right;font-size: 14px;">' +
						numeroTotalbultosCitaSCP +
						'</td>' +
						'</tr>';
				}
				if (arrEntregasSCP.length > 0) {
					var titleCitaSCPHtml = new sap.ui.core.HTML({
						content: '<h4 style="text-align: start;">Resumen de Entregas Sin OC: </h4>'
					});
					var VBoxTitleCitaSCPHtml = new sap.m.VBox({
						width: "100%",
						justifyContent: "Center",
						alignItems: "Start",
						height: "1.5rem"
					});
					VBoxTitleCitaSCPHtml.addItem(titleCitaSCPHtml);
					VBoxPrincipalCita2.addItem(VBoxTitleCitaSCPHtml);

					var oTableSCP = "";
					oTableSCP = '<table style="border: 1px solid black; border-collapse: collapse; width: 100%;" align="center">' +
						'<thead>' +
						'<tr>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="15%" >Motivo</td>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="auto">Entrega & Destinatario</td>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="15%">Destino</td>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="auto">Peso Total<br>(KG)</td>' +
						// '<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="15%">Guia de remisión</td>' +
						'<td style="border:1px solid black;border-collapse:collapse;text-align:center;" width="10%">Cantidad de Embalajes</td>' +
						'</tr>' +
						'</thead>' +
						'<tbody>' +
						entregasSCPDetalle +
						'</tbody>' +
						'</table><br>';

					var oTableSCPHTML = new sap.ui.core.HTML({
						content: oTableSCP
					});

					var VBoxEntregaCitaSCPHtml = new sap.m.VBox({
						width: "100%",
						justifyContent: "Center",
						alignItems: "Stretch",
					});
					VBoxEntregaCitaSCPHtml.addItem(oTableSCPHTML);
					VBoxPrincipalCita2.addItem(VBoxEntregaCitaSCPHtml);
				}

				for (var i = 0; i < Data.ArrayGeneral.length; i++) {
					var destinoCita = Data.ArrayGeneral[i].destino;
					var numeroEntregaCita = Data.ArrayGeneral[i].guia;
					var numBultosCita = Data.ArrayGeneral[i].numeroTotalBultos;
					var almacenCita = Data.ArrayGeneral[i].almacen;
					var cantidadEmbalajeCita = Data.ArrayGeneral[i].cantidadEmbalaje;

					var idCitaCita = Data.ArrayGeneral[i].cita;
					var condEntregaCita = Data.ArrayGeneral[i].condEnt;
					var direccionCita = Data.ArrayGeneral[i].direccion;
					var fechaCita = Data.ArrayGeneral[i].fecha;
					var horaCita = Data.ArrayGeneral[i].hora;
					var zonaCita = Data.ArrayGeneral[i].zona;
					var pesototalbultosCita = that.currencyFormat(Data.ArrayGeneral[i].pesoTotBultos);
					var qrEntregaCita = new sap.m.HBox({})
					var tableEntregaCita = new sap.ui.core.HTML({});

					var textoFecha = "";
					var textoHora = "";
					if (condEntregaCita == "03") {
						textoFecha = "Fecha de Recojo";
						textoHora = "Hora de Recojo";
					} else if (condEntregaCita == "02") {
						textoFecha = "Fecha de llegada";
						textoHora = "Hora de Llegada";
					} else {
						textoFecha = "Fecha Cita"
						textoHora = "Hora Cita";
					}

					var objqrCitaTotal = {
						qrentrega: qrEntregaCita.getId(),
						cita: Data.ArrayGeneral[i].cita,
						entrega: Data.ArrayGeneral[i].entrega,
						arrtext: arrtext,
						almacen: almacenCita,
						placa: Data.ArrayGeneral[i].placa,
						fecha: Data.ArrayGeneral[i].fecha,
						hora: Data.ArrayGeneral[i].hora,
						destino: Data.ArrayGeneral[i].destino,
						nbultos: numBultosCita.toString(),
						condEnt: Data.ArrayGeneral[i].condEnt,
						direccion: Data.ArrayGeneral[i].direccion,
						pesoTotBultos: Data.ArrayGeneral[i].pesoTotBultos,
						zona: Data.ArrayGeneral[i].zona
					}
					arrCitaTotal.push(objqrCitaTotal)
					that.oModel.setProperty("/DataarrCitaTotal", arrCitaTotal);
				}
				VBoxPrincipalCita.addItem(VBoxPrincipalCita2);
				that._byId("total").addItem(VBoxPrincipalCita);
			}

			var arrCita = [];
			var arrQrBultos = [];

			//complementario
			var arrQrBultoComplementario = [];
			for (var i = 0; i < Data.ArrayGeneral.length; i++) {
				var VBoxPrincipalEntrega = new sap.m.VBox({
					width: "720px"
				});
				VBoxPrincipalEntrega.addStyleClass("VBoxPrincipal sapUiSizeCompact");
				var VBoxPrincipalEntrega3 = new sap.m.VBox({
					alignItems: "Center"
				});
				var titleEntrega = new sap.ui.core.HTML({
					content: '<h4 style="text-align: center;">Resumen  de carga a entregar</h4>'
				});
				VBoxPrincipalEntrega3.addItem(titleEntrega);

				var VBoxQREntregaTotal = new sap.m.VBox({
					width: "100%",
				});
				var qrEntrega = new sap.m.HBox({});
				var numeroEntregaTotal = Data.ArrayGeneral[i].entrega;
				var guiaEntregaTotal = "";
				var destino = Data.ArrayGeneral[i].destino;

				if (Data.ArrayGeneral[i].guia.substr(0, 3) == "09-") {
					guiaEntregaTotal = Data.ArrayGeneral[i].guia.substr(3);
				} else {
					guiaEntregaTotal = Data.ArrayGeneral[i].guia;
				}

				var titleEntregaTotalText = '<table width="79%" style="">' +
					'<thead>' +
					'<tr>' +
					'<td style="text-align:center;" width="auto" rowspan="3">' +
					'<div id="' + qrEntrega.getId() + '" style="display: block;margin-left: auto;margin-right: auto;text-align: right;"></div>' +
					'</td>' +
					'<td style="text-align: center;font-size: 35px;margin:0px" width="auto"><strong>' + numeroEntregaTotal + '</strong></td>' +
					'</tr>' +
					'<tr>' +
					'<td style="text-align: center;font-size: 35px;margin:0px" width="auto"><strong>' + guiaEntregaTotal + '</strong></td>' +
					'</tr>' +
					'<tr>' +
					'<td style="text-align: center;font-size: 35px;margin:0px" width="auto"><strong>' + destino + '</strong></td>' +
					'</tr>' +
					'</thead>' +
					'</table>'
				var titleEntregaTotal2Html = new sap.ui.core.HTML({});
				titleEntregaTotal2Html.setContent(titleEntregaTotalText)
				VBoxQREntregaTotal.addItem(titleEntregaTotal2Html);
				VBoxPrincipalEntrega3.addItem(VBoxQREntregaTotal);

				var detalleTitleHtml = new sap.ui.core.HTML({
					content: '<h4 style="text-align: Start;font-weight:normal;">*Esta hoja se debe pegar en cada embalaje según corresponda</h4>'
				});
				var HBoxQRTotalDetalleTitle = new sap.m.HBox({
					width: "100%",
					justifyContent: "Start",
					alignItems: "Center",
					height: "3rem"
				});
				HBoxQRTotalDetalleTitle.addItem(detalleTitleHtml);
				VBoxPrincipalEntrega3.addItem(HBoxQRTotalDetalleTitle);

				var VBoxBultos = new sap.m.VBox({});
				for (var k = 0; k < Data.ArrayGeneral[i].ArrayGeneral.length; k++) {
					var VBoxBulto = new sap.m.VBox({
						width: "100%"
					})
					var tableBultos = new sap.ui.core.HTML({});
					var qrBultos = new sap.m.HBox({});
					var tableHtmlBultos =
						'<p style="width:100%;border-top:2px dotted;height: 5px;"><span style="display:none;height: 5px;">x</span></p>' +
						'<table width="100%" style="border-collapse:collapse;">' +
						'<tbody>' +
						'<tr>' +
						'<td height="36px" style="border:1px solid black;border-collapse:collapse;" width="40%"><strong>' +
						'Embalaje ' + Data.ArrayGeneral[i].ArrayGeneral[k].CantidadEmbalajeBulto + ': ' + Data.ArrayGeneral[i].ArrayGeneral[k].Un_map +
						'</strong></td>' +
						'<td height="36px" style="border:1px solid black;border-collapse:collapse;" width="40%">' +
						Data.ArrayGeneral[i].ArrayGeneral[k].Codigo +
						'</td>' +
						'<td height="36px" style="border:1px solid black;border-collapse:collapse;" width="auto">' +
						Data.ArrayGeneral[i].ArrayGeneral[k].Descipcion +
						'</td>' +
						'<td height="51px" style="" rowspan = "2" width="14%">' +
						'<div id="' + qrBultos.getId() + '" style="display: block;margin-left: auto;margin-right: auto;width: 78%;"></div>' +
						'</td>' +
						'</tr>' +
						'<tr>' +
						'<td height="15px" style="font-size: 14px;border:1px solid black;border-collapse:collapse;"><strong>' +
						'Detalle del Contenido:</strong>' + numeroEntregaTotal + '-' + Data.ArrayGeneral[i].ArrayGeneral[k].CantidadEmbalajeBulto +
						'</td>' +
						'<td height="15px" style="font-size: 14px;text-align: left;border:1px solid black;border-collapse:collapse;" width="35%"><strong>' +
						Data.ArrayGeneral[i].proveedor +
						'</strong></td>' +
						'<td height="15px" style="font-size: 14px;text-align: center;border:1px solid black;border-collapse:collapse;" width="auto">' +
						destino +
						'</td>' +
						'</tr>' +
						'</tbody>' +
						'</table><br>'
					tableBultos.setContent(tableHtmlBultos)
					VBoxBulto.addItem(tableBultos)
					VBoxBultos.addItem(VBoxBulto)

					var objqrBulto = {
						qrBultos: qrBultos.getId(),
						CantidadEmbalajeBulto: Data.ArrayGeneral[i].ArrayGeneral[k].CantidadEmbalajeBulto,
						Un_map: Data.ArrayGeneral[i].ArrayGeneral[k].Un_map,
						bulto: Data.ArrayGeneral[i].ArrayGeneral[k].DescripcionGeneral,
						dimensionbulto: Data.ArrayGeneral[i].ArrayGeneral[k].Descipcion,
						pesobulto: Data.ArrayGeneral[i].ArrayGeneral[k].PesoBult,
						entrega: Data.ArrayGeneral[i].entrega,
						cantidad: Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral.length.toString(),
						ecri: Data.ArrayGeneral[i].ArrayGeneral[k].Codigo
					}
					arrQrBultos.push(objqrBulto)
					that.oModel.setProperty("/DataarrQrBultos", arrQrBultos);
					var VBoxPedidos = new sap.m.VBox({
						width: "100%"
					});

					VBoxBulto.addItem(VBoxPedidos);
					var materiales = "";

					for (var l = 0; l < Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral.length; l++) {
						var oTableMaterialesHTML = new sap.ui.core.HTML({});
						var ecri = Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zecri === undefined ? "" : Data.ArrayGeneral[i].ArrayGeneral[k]
							.ArrayGeneral[l].Zecri;
						var codeMat = that.formatInteger(Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zmatnr) === undefined ? "" :
							that.formatInteger(Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zmatnr);
						var pedido = Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zebeln === undefined ? "" : Data.ArrayGeneral[i].ArrayGeneral[
							k].ArrayGeneral[l].Zebeln;
						var material = Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zmaktx === undefined ? "" : Data.ArrayGeneral[i].ArrayGeneral[
							k].ArrayGeneral[l].Zmaktx;

						var motivo = Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].DESCRIPCION_MOTIVOS === undefined ? "" : Data.ArrayGeneral[i]
							.ArrayGeneral[k].ArrayGeneral[l].DESCRIPCION_MOTIVOS;
						var email = Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].EMAIL_DESTINATARIO_FINAL === undefined ? "" : Data.ArrayGeneral[
							i].ArrayGeneral[k].ArrayGeneral[l].EMAIL_DESTINATARIO_FINAL;
						var area = Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].AREA_RESPONSABLE === undefined ? "" : Data.ArrayGeneral[i].ArrayGeneral[
							k].ArrayGeneral[l].AREA_RESPONSABLE;

						if (!Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].ID_ENTREGA_SIN_OC_CABECERA) {
							materiales += '<tr>' +
								'<td height="18px" style="border:1px solid black;border-collapse:collapse;" >' +
								codeMat +
								'</td>' +
								'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
								material +
								'</td>' +
								'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
								this.currencyFormat(Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zvemng) +
								'</td>' +
								'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
								Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zunmed +
								'</td>' +
								'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
								pedido +
								'</td>' +
								// '<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
								// ecri +
								// '</td>' +
								'</tr>'
						} else {
							if (l == 0) {
								materiales += '<tr>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;" rowspan="' + Data.ArrayGeneral[i].ArrayGeneral[k]
									.ArrayGeneral.length.toString() + '">' +
									motivo +
									'</td>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
									Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zmaktx +
									'</td>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
									this.currencyFormat(Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zvemng) +
									'</td>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
									Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zunmed +
									'</td>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;" rowspan="' + Data.ArrayGeneral[i].ArrayGeneral[k]
									.ArrayGeneral.length.toString() + '">' +
									email +
									'</td>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;" rowspan="' + Data.ArrayGeneral[i].ArrayGeneral[k]
									.ArrayGeneral.length.toString() + '">' +
									area +
									'</td>' +
									'</tr>'
							} else {
								materiales += '<tr>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
									Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zmaktx +
									'</td>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
									this.currencyFormat(Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zvemng) +
									'</td>' +
									'<td height="18px" style="border:1px solid black;border-collapse:collapse;">' +
									Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[l].Zunmed +
									'</td>' +
									'</tr>'
							}

						}

					}

					var oTable = "";
					if (!Data.ArrayGeneral[i].ArrayGeneral[k].ArrayGeneral[0].ID_ENTREGA_SIN_OC_CABECERA) {
						oTable = '<table width="100%" style="border:1px solid black;border-collapse:collapse;">' +
							'<thead>' +
							'<tr>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="auto">Material</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="34%">Descripción</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="15%">Cantidad</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="10%">UM</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="15%">Pedido</td>' +
							// '<td style="border:1px solid black;border-collapse:collapse;" width="15%">Ecri</td>' +
							'</tr>' +
							'</thead>' +
							'<tbody>' +
							materiales +
							'</tbody>' +
							'</table>'
					} else {
						oTable = '<table width="100%" style="border:1px solid black;border-collapse:collapse;">' +
							'<thead>' +
							'<tr>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="15%">Motivo</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="35%">Descripción</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="15%">Cantidad</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="10%">UM</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="10%">Destinatario</td>' +
							'<td style="border:1px solid black;border-collapse:collapse;" width="15%">Área</td>' +
							'</tr>' +
							'</thead>' +
							'<tbody>' +
							materiales +
							'</tbody>' +
							'</table>'
					}

					oTableMaterialesHTML.setContent(oTable);

					VBoxPedidos.addItem(oTableMaterialesHTML);
					VBoxBulto.addItem(VBoxPedidos);

					if (Data.ArrayGeneral[i].ArrayGeneral[k].ArrayComplementario.length > 0) {
						var VBoxBultosComplementario = new sap.m.VBox({
							width: "100%"
						});
						for (var l = 0; l < Data.ArrayGeneral[i].ArrayGeneral[k].ArrayComplementario.length; l++) {
							var qrBultosComplementario = new sap.m.HBox({});
							var dataComplementario = Data.ArrayGeneral[i].ArrayGeneral[k].ArrayComplementario[l];
							var descipcionComplementario = that.formatNoDecimal(parseFloat(dataComplementario.LAENG).toFixed(2)) + "x" +
								that.formatNoDecimal(parseFloat(dataComplementario.BREIT).toFixed(2)) + "x" +
								that.formatNoDecimal(parseFloat(dataComplementario.HOEHE).toFixed(2));
							var oTableBultoComplementarioHtml = new sap.ui.core.HTML({});
							var oTableComplementario =
								'<p style="width:100%;border-top:2px dotted;height: 5px;"><span style="display:none;height: 5px;">x</span></p>' +
								'<table width="100%" style="border-collapse:collapse;">' +
								'<tbody>' +
								'<tr>' +
								'<td height="36px" style="border:1px solid black;border-collapse:collapse;" width="40%"><strong>' +
								'Embalaje complementario ' + Data.ArrayGeneral[i].ArrayGeneral[k].ArrayComplementario[l].VHILM_KU_SUB +
								'</strong></td>' +
								'<td height="36px" style="border:1px solid black;border-collapse:collapse;" width="40%">' +
								Data.ArrayGeneral[i].ArrayGeneral[k].ArrayComplementario[l].BEZEI2 +
								'</td>' +
								'<td height="36px" style="border:1px solid black;border-collapse:collapse;" width="auto">' +
								descipcionComplementario +
								'</td>' +
								'<td height="51px" style="" rowspan = "2" width="14%">' +
								'<div id="' + qrBultosComplementario.getId() +
								'" style="display: block;margin-left: auto;margin-right: auto;width: 78%;"></div>' +
								'</td>' +
								'</tr>' +
								'<tr>' +
								'<td height="15px" style="font-size: 14px;border:1px solid black;border-collapse:collapse;"><strong>' +
								'Detalle del Contenido:</strong>' + dataComplementario.INHALT +
								'</td>' +
								'<td height="15px" style="font-size: 14px;text-align: left;border:1px solid black;border-collapse:collapse;" width="35%"><strong>' +
								Data.ArrayGeneral[i].proveedor +
								'</strong></td>' +
								'<td height="15px" style="font-size: 14px;text-align: center;border:1px solid black;border-collapse:collapse;" width="auto">' +
								destino +
								'</td>' +
								'</tr>' +
								'</tbody>' +
								'</table><br>'

							oTableBultoComplementarioHtml.setContent(oTableComplementario);
							VBoxBultosComplementario.addItem(oTableBultoComplementarioHtml);

							var objqrBultoComplementario = {
								qrBultosComplementario: qrBultosComplementario.getId(),
								bulto: dataComplementario.VHILM_KU,
								Un_map: dataComplementario.EXIDV,
								bultoComplementario: dataComplementario.VHILM_KU_SUB,
								dimensionbulto: descipcionComplementario,
								pesobulto: dataComplementario.BRGEW,
								entrega: dataComplementario.VBELN
							}
							arrQrBultoComplementario.push(objqrBultoComplementario)

						}

						VBoxBulto.addItem(VBoxBultosComplementario)

					}

					that.oModel.setProperty("/DataarrQrBultosComplementario", arrQrBultoComplementario);

				}

				var sociedad = Data.ArrayGeneral[i].sociedad;
				var numeroEntrega = Data.ArrayGeneral[i].guia;
				var numBultos = Data.ArrayGeneral[i].numeroTotalBultos;
				//campos nuevos
				var almacen = Data.ArrayGeneral[i].almacen;
				var cantidadEmbalaje = Data.ArrayGeneral[i].cantidadEmbalaje;
				//
				var idCita = Data.ArrayGeneral[i].cita;
				var condEntrega = Data.ArrayGeneral[i].condEnt;
				var codCondEntrega = Data.ArrayGeneral[i].codcondEnt;
				var direccion = Data.ArrayGeneral[i].direccion;
				var fecha = Data.ArrayGeneral[i].fecha;
				var hora = Data.ArrayGeneral[i].hora;
				var zona = Data.ArrayGeneral[i].zona;
				var pesototalbultos = that.currencyFormat(Data.ArrayGeneral[i].pesoTotBultos);

				var objqrCita = {
					qrentrega: qrEntrega.getId(),
					cita: Data.ArrayGeneral[i].cita,
					entrega: Data.ArrayGeneral[i].entrega,
					arrtext: arrtext,
					almacen: almacen,
					placa: Data.ArrayGeneral[i].placa,
					fecha: Data.ArrayGeneral[i].fecha,
					hora: Data.ArrayGeneral[i].hora,
					destino: Data.ArrayGeneral[i].destino,
					nbultos: numBultos.toString(),
					condEnt: Data.ArrayGeneral[i].condEnt,
					direccion: Data.ArrayGeneral[i].direccion,
					pesoTotBultos: Data.ArrayGeneral[i].pesoTotBultos,
					zona: Data.ArrayGeneral[i].zona
				}
				arrCita.push(objqrCita)
				that.oModel.setProperty("/DataarrCita", arrCita);

				VBoxPrincipalEntrega.addItem(VBoxPrincipalEntrega3)
				VBoxPrincipalEntrega.addItem(VBoxBultos)
				that._byId("total").addItem(VBoxPrincipalEntrega)
			}
		},
		downloadQr: function () {
			this.GetSendOnbaseCitaEntrega("yes");
			that.getView().byId("total").destroyItems();
			this.CancelarDocQr();
		},
		GetSendOnbaseCitaEntrega: function (save) {
			var oView = that.getView();
			if (save != "no") {
				that.entregas.sort(function (a, b) {
					return a.entrega - b.entrega;
				});
			}

			oView.byId("DialogFormatQR").getScrollDelegate().scrollTo(0, 0)

			var idInicial = this.getView().byId("total").getDomRef().firstChild.id
			var idFinal = this.getView().byId("total").getDomRef().lastChild.id

			var idtotal = this.getView().byId("total").getDomRef().id
			var rango = $("#" + idtotal + "> div").length
			var arr = [];
			var nameEntrega, cita, j;
			var listaAux = [];
			that.Base64 = [];

			sap.ui.core.BusyIndicator.show(0);

			for (var i = 0; i < rango; i++) {
				var divs = $("#" + idtotal + "> div").get(i)

				var fileContent = $("#" + divs.id).wordExport();
				var blob = new Blob([fileContent], {
					type: "application/msword;charset=utf-8"
				});
				if (that.entregas[0].codcondEnt == "01") {
					if (i == 0) {
						var obj = {
							cita: that.entregas[0].cita,
							entrega: "",
							file: btoa(fileContent)
						};
						if (save === "yes") {
							saveAs(blob, "Cita numero:" + that.entregas[0].cita + ".doc");
						}
						that.Base64.push(obj);
					} else {
						nameEntrega = that.entregas[i - 1].entrega;
						var obj = {
							cita: that.entregas[0].cita,
							entrega: nameEntrega,
							file: btoa(fileContent)
						};
						if (save === "yes") {
							saveAs(blob, "Entrega numero:" + nameEntrega + ".doc");
						}
						that.Base64.push(obj);
					}
				} else {
					nameEntrega = that.entregas[i].entrega;
					var obj = {
						cita: that.entregas[0].cita,
						entrega: nameEntrega,
						file: btoa(unescape(encodeURIComponent((fileContent))))
					};

					if (save === "yes") {
						saveAs(blob, "Entrega numero:" + nameEntrega + ".doc");
					}

					that.Base64.push(obj);
				}
				
				if(i === rango -1){
					sap.ui.core.BusyIndicator.hide(0);
				}
			}
		},
		CancelarDocQr: function () {
			var that = this;
			that.byId("total").destroyItems();
			if (that.byId("DialogFormatQR") != undefined) {
				that.byId("DialogFormatQR").close();
			}
			if (that.byId("DialogMant") != undefined) {
				that.byId("DialogMant").close();
			}
			if (that.byId("DialogEntregasTemp") != undefined) {
				that.byId("DialogEntregasTemp").close();
			}
			this.fnClearDataFechaPlan();
			this.fnClearComponentFechaPlan();
			if(that._byId("frgIdFechaPlan--DialogFechaPlan") != undefined){
				that._byId("frgIdFechaPlan--DialogFechaPlan").close();
			}
			that.handleRouteMatched();
		},
		ordenarEntrega: function (entrega) {
			console.log(entrega)
			entrega.sort(function (a, b) {
				return a.entrega - b.entrega;
			});
			for (var i = 0; i < entrega.length; i++) {
				entrega[i].ArrayGeneral.sort(function (a, b) {
					return a.DescripcionGeneral - b.DescripcionGeneral;
				});
			}
			return entrega;
		},

		abrirnewDialogGuiaTemp: function () {
			var arrayOrdenes = that.oModel.getProperty("/oEntregaSelect");;
			var fecha;
			var arr = [];
			clearTimeout(timeOutFecha);
			if (target == "03") {
				var validateCita = [];
				validateCita = that.validateCita();
				if (!validateCita.validate) {
					utilUI.onMessageErrorDialogPress2(validateCita.msj);
					return;
				}
			}

			var seleccionado = that._byId(this.frgIdFechaPlan + "--tbRegistroDisponible").getSelectedIndex();
			var contextActual = "/DataFecha/" + seleccionado.toString();
			var contextNuevo = "/DataFecha/" + (seleccionado + 1).toString();
			var actual = that.oModel.getProperty(contextActual);
			var nuevo = that.oModel.getProperty(contextNuevo);

			fecha = actual;

			if (sTarget == "02") {} else if (target == "03") {
				for (var i = 0; i < arrayOrdenes.length; i++) {
					if (arrayOrdenes[i].Zbolnr.substr(0, 2) == "09") {
						arrayOrdenes[i].Zbolnr = arrayOrdenes[i].Zbolnr.substr(3);
						arrayOrdenes[i].numGuia = arrayOrdenes[i].numGuia.substr(3);
					}
				}
			}
			that.oModel.setProperty("/fecha", fecha);

			var arrHorarioTotal = [];
			var obj = {};
			var condEntrega = arrayOrdenes[0].lugdestino;
			if (condEntrega == "03") {
				obj.TitleFecha = "Fecha de Recojo"
				obj.TitleHora = "Hora de Recojo"
			} else if (condEntrega == "02") {
				obj.TitleFecha = "Fecha de Llegada"
				obj.TitleHora = "Hora de Llegada"
			} else if (condEntrega == "01") {
				obj.TitleFecha = "Fecha Cita"
				obj.TitleHora = "Hora Cita"
			} else {
				obj.TitleFecha = "Fecha"
				obj.TitleHora = "Hora"
			}
			arrHorarioTotal.push(obj)

			tha.oModel.setProperty("/DataFechaNoProg", arrHorarioTotal);

			if (!oView.byId("DialogEntregasTemp")) {
				Fragment.load({
					id: oView.getId(),
					name: "com.rava.fragment.Cambios.Entregas",
					controller: that
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					sap.ui.core.BusyIndicator.hide(0);
					oDialog.open();
					oView.byId("nEntregaSeleccionadas").setText(arrayOrdenes.length)
				});
			} else {
				sap.ui.core.BusyIndicator.hide(0);
				oView.byId("DialogEntregasTemp").open();
				oView.byId("nEntregaSeleccionadas").setText(arrayOrdenes.length)
			}
		},
		validateCita: function () {
			var that = this;
			var oView = this.getView();

			var DataEntregasPlanificadas = oView.getModel("Proyect").getProperty("/DataEntregasPlanificadas");
			var EntregasSelecionadas = that.oModel.getProperty("/arrayOrdenesPlanificadas");
			var boolean = true;
			var cont = 0;
			var table = oView.byId("TreeTable2");
			var Selecciones = table.getSelectedIndices();
			var msj = "";
			var textCita = "";
			var entregasMensaje = [];

			if (EntregasSelecionadas.length > 0) {
				if (EntregasSelecionadas[0].numCitas.toString() != "") {
					textCita = EntregasSelecionadas[0].numCitas.toString();
					for (var i = 0; i < DataEntregasPlanificadas.ArrayGeneral.length; i++) {
						if (EntregasSelecionadas[0].numCitas.toString() == DataEntregasPlanificadas.ArrayGeneral[i].numCitas.toString()) {
							entregasMensaje.push(DataEntregasPlanificadas.ArrayGeneral[i].DescripcionGeneralEntrega.toString())
							cont++;
						}
					}

					if (cont == Selecciones.length) {
						boolean = true;
					} else {
						msj = "Falta seleccionar entregas para la cita " + textCita + ". Entregas Relacionadas " + entregasMensaje.join();
						boolean = false;
					}

				} else {
					boolean = true;
				}
			} else {
				msj = "Debe seleccionar la entrega para descargar el documento ";
				boolean = false;
			}
			var json = {
				"validate": boolean,
				"msj": msj,
				"entregas": entregasMensaje
			};

			return json;
		},

		_onPressCloseFechaPlan: function (oEvent) {
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
			that.oModel.setProperty("/DataConstante", []);
			that.oModel.setProperty("/DataFecha", []);
		},
		fnClearComponentFechaPlan: function () {
			if(that._byId(this.frgIdFechaPlan + "--tbRegistroDisponible")){
				that._byId(this.frgIdFechaPlan + "--tbRegistroDisponible").clearSelection(true);
				that._byId(this.frgIdFechaPlan + "--fecharangoInicialPlan").setValue("");
				that._byId(this.frgIdFechaPlan + "--fecharangoFinalPlan").setValue("");
				that._byId(this.frgIdFechaPlan + "--nEntregaPlan").setValue("");
			}
		},

		ValidarCamposPendientes: function (oEvent) {
			var contador = 0;
			var contador2 = 0;
			var contador3 = 0;
			var contador4 = 0;
			var table = that._byId("TreeTableBasic");
			var context = oEvent.getParameter("rowContext");
			if (context != null) {
				var object = that.oModel.getProperty(context.sPath);
				var oIndex = oEvent.getParameter('rowIndex');

				var Selecciones = table.getSelectedIndices();
				var selectedEntries = [];
				for (var i = 0; i < Selecciones.length; i++) {
					var oData = table.getContextByIndex(Selecciones[i]);
					selectedEntries.push(oData.getProperty(oData.getPath()));
				}
				if (Selecciones.length > 1) {
					if (selectedEntries.length > 0) {
						for (var i = 0; i < selectedEntries.length; i++) {
							if (selectedEntries[i].Desc_cond == object.Desc_cond) {
								contador3++;
							}

						}
						if (contador3 == 0) {} else if (contador3 != Selecciones.length) {
							utilUI.onMessageErrorDialogPress2("Solo es posible seleccionar entregas de una misma condición");
							table.removeSelectionInterval(oIndex, oIndex);
							var i = selectedEntries.indexOf(object);
							if (i !== -1) {
								selectedEntries.splice(i, 1);
							}
							return;
						}
					}
					// if (Object.keys(oDataCond).length > 0) {
					// 	for (var j = 0; j < Object.keys(oDataCond).length; j++) {
					// 		for (var i = 0; i < selectedEntries.length; i++) {
					// 			if (oDataCond[j].DESCRIPCION == selectedEntries[i].desclugardestino) {
					// 				contador++;
					// 			}
					// 		}
					// 	}
					// 	if (contador == 0) {

					// 	} else if (contador != Selecciones.length) {
					// 		table.removeSelectionInterval(oIndex, oIndex);
					// 		var i = selectedEntries.indexOf(object);
					// 		if (i !== -1) {
					// 			selectedEntries.splice(i, 1);
					// 		}
					// 		return;
					// 	}
					// }

					// if (Object.keys(oDataCentro).length > 0) {
					// 	for (var j = 0; j < Object.keys(oDataCentro).length; j++) {
					// 		for (var i = 0; i < selectedEntries.length; i++) {
					// 			if (oDataCentro[j].CENTRO == selectedEntries[i].Centro) {
					// 				contador2++;
					// 			}
					// 		}
					// 	}
					// 	if (contador2 == 0) {

					// 	} else if (contador2 != Selecciones.length) {
					// 		table.removeSelectionInterval(oIndex, oIndex);
					// 		var i = selectedEntries.indexOf(object);
					// 		if (i !== -1) {
					// 			selectedEntries.splice(i, 1);
					// 		}
					// 		return;
					// 	}
					// }
				}
				if (!object.Vbeln.toString()) {
					table.removeSelectionInterval(oIndex, oIndex);
				}
			}
		},
		_onPressDeleteEnt: function (oEvent) {
			var oSource = oEvent.getSource();
			var oRow = oSource.getParent();
			var sTable = "";
			var oEntregaSelect = [];
			if (sTarget == "02") {
				sTable = "TreeTableBasic";
			} else {
				sTable = "TreeTableBasic2";
			}
			var oTable = that.byId(sTable);
			var oIndeces = oTable.getSelectedIndices();

			if (oIndeces.length === 0) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
				return;
			} else {
				oIndeces.forEach(function (value) {
					var jEntSelect = oTable.getContextByIndex(value).getObject();
					oEntregaSelect.push(jEntSelect);
				});
				if (sTarget === "02") {
					if (oIndeces.length === 0) {
						utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
						return;
					}
					if (oEntregaSelect.length > 1) {
						utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorDeleteOneEnt"));
						return;
					}
					utilUI.messageBox(this.getI18nText("sConfirmDeleteEnt"), "C", function (value) {
						if (value) {
							that.fnOperacionEliminarEntregaTarget2(oEntregaSelect);
						}
					});
				}
			}
		},
		fnOperacionEliminarEntregaTarget2: function (arrayOrdenes) {
			var EntregasERP = [];
			var EntregaSCP = [];
			EntregaSCP = arrayOrdenes.filter(function (obj) {
				return obj.codtipoData === "02";
			});
			EntregasERP = arrayOrdenes.filter(function (obj) {
				return obj.codtipoData === "01";
			});

			if (EntregasERP.length > 0) {
				var Entregas_a_Eliminar = [];
				var EntregaSap;

				EntregasERP.map(function (obj) {
					EntregaSap = {
						"Cont": "1",
						"Vbeln": obj.Vbeln.toString(), //Entrega a Eliminar al Sap
						"Cita": "",
						"Message": ""
					}
					Entregas_a_Eliminar.push(EntregaSap);
				});

				var dataE = {
					"Eliminar": "X",
					"ItemEntSet": Entregas_a_Eliminar,
					"user": that.getRuc(),
					"NAVRESULT": [{
						"Mensaje2": "",
						"Mensaje": ""
					}]
				};
				var oResults = {
					"oResults": dataE
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
			} else if (EntregaSCP.length > 0) {
				var EntregaEliminar = [];
				EntregaSCP.map(function (obj) {
					EntregaEliminar.push(obj.Vbeln.toString());
				});
				var dataSinOCHanna = {
					"oResults": {
						"ENTREGA": EntregaEliminar
					}
				};
				sap.ui.core.BusyIndicator.show(0);
				Services.EliminarEntregaTarget2(that, dataSinOCHanna, function (result) {
					util.response.validateFunctionSingleEnd(result, {
						success: function (data, message) {
							utilUI.messageBox(that.getI18nText("sSuccessDeleteEnt"), "S", function (value) {
								if (value) {
									that.handleRouteMatched();
								}
							});
						},
						error: function (jqXHR, textStatus, errorThrown) {
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

		_onPressDeleteAppoitment: function (oEvent) {
			var oSource = oEvent.getSource();
			var oRow = oSource.getParent();
			var sTable = "";
			var oEntregaSelect = [];
			sTable = "TreeTableBasic2";
			var oTable = that.byId(sTable);
			var oIndeces = oTable.getSelectedIndices();

			if (oIndeces.length === 0) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
				return;
			} else {
				oIndeces.forEach(function (value) {
					var jEntSelect = oTable.getContextByIndex(value).getObject();
					oEntregaSelect.push(jEntSelect);
				});
				if (oIndeces.length === 0) {
					utilUI.onMessageErrorDialogPress2(that.getI18nText("ErrorNoSeleccionCita"));
					return;
				}
				
				var validateCita = {};
				validateCita = that.validateCita(oEntregaSelect);
				
				var validateHorario = {};
				validateHorario = that.validateHorario(oEntregaSelect);
				
				if (!validateCita.validate) {
					utilUI.onMessageErrorDialogPress2(validateCita.msj);
					return;
				}
				
				if (!validateHorario.validate) {
					utilUI.onMessageErrorDialogPress2(validateHorario.msj);
					return;
				}
				utilUI.messageBox(this.getI18nText("sConfirmDeleteCita"), "C", function (value) {
					if (value) {
						that.fnOperacionEliminarCitaTarget3(oEntregaSelect, "");
					}
				});
			}
		},
		fnOperacionEliminarCitaTarget3: function (arrayOrdenes, text) {
			var EntregasERP = [];
			var EntregaSCP = [];
			EntregaSCP = arrayOrdenes.filter(function (obj) {
				return obj.codtipoData === "02";
			});
			EntregasERP = arrayOrdenes.filter(function (obj) {
				return obj.codtipoData === "01";
			});

			var estatus = that.oModelGet.getProperty("/oEstado");
			var codigoestatus = estatus[3].Campo;
			var descestatus = estatus[3].DescripcionCampo;
			if (arrayOrdenes[0].ZzlugEnt == '01') {
				if (arrayOrdenes[0].ZcitaNp == "PROGRAMADO" || arrayOrdenes[0].ZcitaNp == "PROGRAMADA") {
					var arr3 = [];
					var fecha;
					var horario;
					var centro;
					var proveedor;
					for (var i = 0; i < arrayOrdenes.length; i++) {
						fecha = that.formaterxTemp(arrayOrdenes[i].Zlfdat);
						horario = that.formatHourTemp(arrayOrdenes[i].Zlfuhr) + ":00";
						centro = arrayOrdenes[i].Zwerks;
						proveedor = arrayOrdenes[i].Zlifnr;
						var objDelete = {
							"id": "",
							"fecha": fecha,
							"hora": horario,
							"centro": centro,
							"codprov": proveedor,
							"fechaInit": fecha,
							"horaInit": horario
						}
						arr3.push(objDelete)
					}
					that.BuscarDeleteXsjs(arr3);
				}
			}

			var EntregaEliminarSCP = [];
			var EntregaEliminarERP = [];
			EntregaSCP.map(function (obj) {
				var jEliminar = {
					ENTREGA: obj.Zvbeln.toString(),
					ESTATUS_USUARIO: codigoestatus,
					DESCRIPCION_ESTATUS_USUARIO: descestatus,
				};
				EntregaEliminarSCP.push(jEliminar);
			});
			
			EntregasERP.map(function (obj) {
				var jEliminar = {
					Vbeln: obj.Zvbeln.toString(),
					Zzlfstk: codigoestatus,
					Zcita: ""
				};
				EntregaEliminarERP.push(jEliminar);
			});
			
			if (text.indexOf("entrega(s)") !== -1) {
				EntregaEliminar.map(function (obj) {
					text = text.replace("entrega(s)", "entrega(s) " + obj.ENTREGA);
				});
			}

			var dataSinOCHanna = {
				"oResults": {
					"EntregaEliminarSCP": EntregaEliminarSCP,
					"EntregaEliminarERP": EntregaEliminarERP,
					"user": that.getRuc(),
				}
			};
			// return;
			sap.ui.core.BusyIndicator.show(0);
			Services.EliminarCita(that, dataSinOCHanna, function (result) {
				util.response.validateFunctionSingleEnd(result, {
					success: function (data, message) {
						utilUI.messageBox(that.getI18nText("sSuccessDeleteCita"), "S", function (value) {
								if (value) {
									that.handleRouteMatched();
								}
							});
					},
					error: function (jqXHR, textStatus, errorThrown) {
						sap.ui.core.BusyIndicator.hide(0);
					}
				});
			});
		},

		BuscarDeleteXsjs: function (contentProv) {
			var content = [];

			var matriz = {};
			contentProv.forEach(function (registro) {
				var horaInit = registro["horaInit"];
				var centro = registro["centro"];
				matriz[horaInit] = matriz[horaInit] ? (matriz[horaInit] + 1) : 1;
				matriz[centro] = matriz[centro] ? (matriz[centro] + 1) : 1;
			});

			matriz = Object.keys(matriz).map(function (horaInit) {
				return {
					data: horaInit,
					cant: matriz[horaInit]
				};
			});

			var arrMatriz = [];
			arrMatriz = matriz;
			var cantProveedor = arrMatriz.length;
			const myObj2 = {}

			for (var i = 0, len = arrMatriz.length; i < len; i++)
				myObj2[arrMatriz[i]['cant']] = arrMatriz[i].cant;

			arrMatriz = new Array();
			for (var key2 in myObj2)
				arrMatriz.push(myObj2[key2]);
			// Your code here!

			for (var i = 0; i < matriz.length; i++) {
				for (var l = 0; l < contentProv.length; l++) {
					// if (arrMatriz.length > 1) {
					// 	if (matriz[i].data == contentProv[l].centro) {
					// 		contentProv[l].count = matriz[i].cant;
					// 	}
					// } else {
						if (matriz[i].data == contentProv[l].horaInit) {
							contentProv[l].count = matriz[i].cant;
						}
					// }
				}
			}

			var content = [];
			contentProv.forEach(item => {
				try {
					if (JSON.stringify(content[content.length - 1]) !== JSON.stringify(item)) {
						content.push(item);
					}
				} catch (err) {
					content.push(item);
				}
			});

			for (var i = 0; i < content.length; i++) {
				var fecha = content[i].fechaInit;
				var horario = content[i].horaInit;
				var centro = content[i].centro;
				var codprov = content[i].codprov;
				var id = content[i].id;
				var url = "/hana/IPROVIDER_ENTREGA/REGISTRO_FECHA/RegistroHorarioFiltrar.xsjs?centro=" + centro + "&codprov=" + codprov +
					"&fecha=" + fecha + "&horario=" + horario
				$.ajax({
					url: url,
					method: "GET",
					async: false,
					contentType: 'application/json',
					headers: {
						Authorization: "Basic VVNSX1JBVkE6UmF2YTIwMjAk"
					},
					success: function (data) {
						var objtotal = {}
						if (Object.keys(data).length > 0) {
							data[0].ID_REGISTRO = data[0].ID_REGISTRO.toString();
							data[0].FECHA = (data[0].FECHA).split("T")[0];
							data[0].HORA = (data[0].HORA).split("T")[1].split(".")[0];
							for (var k = 0; k < content.length; k++) {
								if (data[0].HORA == content[k].horaInit) {
									var resto = (parseInt(data[0].ENTREGAS_REGISTRADAS) - content[k].count);
									if (resto < 0) {
										resto = 0;
									}
									data[0].ENTREGAS_REGISTRADAS = resto.toString();
									break;
								}
							}

							if (data[0].ENTREGAS_REGISTRADAS == "0") {
								that.methodDeleteXsjs(data[0].ID_REGISTRO);
							} else {
								that.methodUpdateXsjs(data[0]);
							}
						}
					},
					error: function (e) {
						console.log("Ocurrio un error" + JSON.parse(e))
					}
				});

			}
		},
		methodDeleteXsjs: function (id) {
			$.ajax({
				url: "/hana/IPROVIDER_ENTREGA/REGISTRO_FECHA/RegistroFecha.xsjs?id_registro=" + id,
				method: "DELETE",
				contentType: 'application/json',
				headers: {
				Authorization: "Basic VVNSX1JBVkE6UmF2YTIwMjAk"
				},
				success: function (data) {
				},
				error: function (e) {
					console.log("Ocurrio un error" + JSON.parse(e))
					MessageToast.show("Erro al borrar registro");
				}
			});
 		},
 		methodUpdateXsjs: function (content) {
			$.ajax({
				url: "/hana/IPROVIDER_ENTREGA/REGISTRO_FECHA/RegistroFecha.xsjs",
				type: "PUT",
				contentType: 'text/json',
				async: false,
				headers: {
				Authorization: "Basic VVNSX1JBVkE6UmF2YTIwMjAk"
				},
				data: JSON.stringify(content)
			})
 		},
 		
 		validateCita: function (oEntregaSelect) {
 			var DataEntregasPlanificadas = that.oModel.getProperty("/oEntregasConCita");
 			var EntregasSelecionadas = oEntregaSelect;
 			var boolean = true;
 			var cont = 0;
 			var table = that.byId("TreeTableBasic2");
 			var Selecciones = table.getSelectedIndices();
 			var msj = "";
 			var textCita = "";
 			var entregasMensaje = [];

 			if (EntregasSelecionadas.length > 0) {
 				if (EntregasSelecionadas[0].Zcita.toString() != "") {
 					textCita = EntregasSelecionadas[0].Zcita.toString();
 					for (var i = 0; i < DataEntregasPlanificadas.length; i++) {
 						if (EntregasSelecionadas[0].Zcita.toString() == DataEntregasPlanificadas[i].Zcita.toString()) {
 							entregasMensaje.push(DataEntregasPlanificadas[i].Zvbeln.toString())
 							cont++;
 						}
 					}

 					if (cont == Selecciones.length) {
 						boolean = true;
 					} else {
 						msj = "Falta seleccionar entregas para la cita " + textCita + ". Entregas Relacionadas " + entregasMensaje.join();
 						boolean = false;
 					}

 				} else {
 					boolean = true;
 				}
 			} else {
 				msj = "Debe seleccionar la entrega para descargar el documento ";
 				boolean = false;
 			}
 			var json = {
 				"validate": boolean,
 				"msj": msj,
 				"entregas": entregasMensaje
 			};

 			return json;
 		},
 		validateHorario: function (oEntregaSelect) {
 			var DataEntregasPlanificadas = that.oModel.getProperty("/oEntregasConCita");
 			var EntregasSelecionadas = oEntregaSelect;
 			var boolean = true;
 			var cont = 0;
 			var table = that.byId("TreeTableBasic2");
 			var Selecciones = table.getSelectedIndices();
 			var msj = "";
 			var textCita = "";
 			var entregasMensaje = [];

 			var dateActual = new Date();

 			var fecha = EntregasSelecionadas[0].Zlfdat;
 			var date = fecha.substr(0, 4) + "/" + fecha.substr(4, 2) + "/" + fecha.substr(6, 2);
 			var hora = this.formatHourTemp(EntregasSelecionadas[0].Zlfuhr);
 			var datePlanificada = new Date(date + " " + hora);

 			var data = that.oModelGet.getProperty("/oHorasTolerancia");
 			if (data.length > 0) {
 				var number = data[0].CONTADOR;
 				if (datePlanificada.getTime() > dateActual.getTime()) {
 					if (dateActual.getTime() < datePlanificada.getTime() - 1 * (parseInt(number)) * 60 * 60 * 1000) {
 						msj = "";
 						boolean = true;
 					} else {
 						msj = "No es posible eliminar la(s) entrega(s) " + data[0].CONTADOR + " horas antes de la fecha planificada";
 						boolean = false;
 					}
 				} else {
 					msj = "";
 					boolean = true;
 				}
 			} else {
 				msj = "";
 				boolean = true;
 			}

 			var json = {
 				"validate": boolean,
 				"msj": msj
 			};

 			return json;
 		},
		
		_onPressDownload: function (oEvent) {
 			var oBindingContext = oEvent.getSource().getParent().getBindingContext("oModel");
 			var oBindingObject = oBindingContext.getObject();
 			var Json;
 			var Json2;
 			
 			var arrayOrdenes = that.oModel.getProperty('/oEntregasConCita');
			var cita = oBindingObject.Zcita;
			
 			var dataOrdenesERP = [];
 			var dataOrdenesSCP = [];
			var listaGeneral = [];
 			for (var i = 0; i < arrayOrdenes.length; i++) {
 				var Ordenes = arrayOrdenes[i];
 				if (Ordenes.codtipoData == "01") {
 					dataOrdenesERP.push(Ordenes);
 				} else if (Ordenes.codtipoData == "02") {
 					dataOrdenesSCP.push(Ordenes);
 				}
 				if(Ordenes.Zcita === cita){
 					Ordenes.materiales.forEach(function(value){
 						listaGeneral.push(value);
 					});
 				}
 			}

 			var estructuraDataTotalERP = {};
 			var estructuraDataTotalSCP = {};
 			var estructuraDataArrayOrdenes = {};
			
 			that.exitopdf(that, "Documento de Cita Número: " + cita , cita, listaGeneral, 1);
 		}
	});
});
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"solicitarcitapr/controller/BaseController",
	"../services/Services",
	'../util/util',
	"../util/utilUI",
], function (Controller, BaseController, Services, util, utilUI) {
	"use strict";

	var that;
	return BaseController.extend("solicitarcitapr.controller.OrderOC", {
		onInit: function () {
			that = this;
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("TargetOrderOC").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			this.frgIdPackingOC = "frgIdPackingOC";
		},
		handleRouteMatched: function () {
			that.oModel = this.getModel("oModel");
			that.oModelGet = this.getModel("oModelGet");
			that.oModelUser = this.getModel("oModelUser");

			that.oModel.setSizeLimit(99999999);
			that.oModelGet.setSizeLimit(99999999);

			sap.ui.core.BusyIndicator.show(0);
			Promise.all([this.getDataMaestro(["T_ERP_LUMP_TYPE", "T_ERP_UNIDADES"])]).then(async values => {
				this.fnClearComponent();
				this.fnClearData();

				var oDataEntregaOCPrev = that.oModel.getProperty("/oDataEntregaOCPrev");
				if (!that.isEmpty(oDataEntregaOCPrev)) {
					this.getModel("oModel").setProperty("/oDataEntregaOC", oDataEntregaOCPrev);
				}

				//Uso de Tipo Bulto
				var oDataTipoBulto = values[0].T_ERP_LUMP_TYPE;
				that.oModelGet.setProperty("/oTipoBulto", oDataTipoBulto);
				//Uso de Unidad
				var oDataUnidades = values[0].T_ERP_UNIDADES;
				that.oModelGet.setProperty("/oUnidades", oDataUnidades);

				sap.ui.core.BusyIndicator.hide(0);
			}).catch(function (oError) {
				sap.ui.core.BusyIndicator.hide(0);
			});
		},
		fnClearData: function () {
			that.oModel.setProperty("/oDataEntregaOC", []);
		},
		fnClearComponent: function () {
			that._byId("tbOrderMaterial").clearSelection(true);
		},
		_onPressPackingOC: function (oEvent) {
			var oSource = oEvent.getSource();
			var oTable = oSource.getParent().getParent();
			var oIndeces = oTable.getSelectedIndices();
			var oMaterials = [];
			oIndeces.forEach(function (value) {
				var jSelect = oTable.getContextByIndex(value).getObject();
				oMaterials.push(jSelect);
			});

			var oResults = [];
			for (var i = 0; i < oMaterials.length; i++) {
				var jVariable = {
					"MatnrD": oMaterials[i].MatnrD,
					"EbelnD": oMaterials[i].EbelnD,
					"MeinsD": oMaterials[i].MeinsD,
					"Txz01D": oMaterials[i].Txz01D,
					"EindtpD": oMaterials[i].EindtpD,
					"EbelpD": oMaterials[i].EbelpD,
					"Xhupf": oMaterials[i].Xhupf,
					"TdlinePos1": oMaterials[i].TdlinePos1,
					"TdlinePos": oMaterials[i].TdlinePos,
					"Zet_textospedidoSet": [],
					"CantTotal": that.replaceNotAll(oMaterials[i].MengezuD),
					"MengezuD": that.replaceNotAll(oMaterials[i].MengezuD)
				}
				oResults.push(jVariable);
			}

			oResults.forEach(function (value) {
				value.MengezuD = that.formatInteger(value.MengezuD);
				value.CantTotal = that.currencyFormat(value.CantTotal);
			});

			that.oModel.setProperty("/oEmbalajeEntregaconOC", []);
			that.oModel.setProperty("/oEmbalajeItemsconOC", oResults);
			this.setFragment("_dialogPackingOC", this.frgIdPackingOC, "PackingOC", this);
		},

		//funcionalidades dialog
		fnPressAddEmbalajes: function () {
			var DataBultos = that.oModel.getProperty("/oEmbalajeEntregaconOC");
			var Mayor = 0;
			if (DataBultos.length === 0) {
				Mayor = 1;
			} else {
				DataBultos.forEach(function (a) {
					if (a.Num > Mayor) {
						Mayor = a.Num;
					}
				});
				Mayor = Mayor + 1;
			}
			var obj = {
				Num: Mayor,
				TipoBulto: "",
				TipoBultoDesc: "",
				enabledTpB: true,
				CantBulto: "",
				Observacion: "",
				PesoBulto: "",
				Longitud: "",
				Ancho: "",
				Altura: "",
				Array: []
			};
			DataBultos.push(obj);
			that.oModel.setProperty("/oEmbalajeEntregaconOC", DataBultos);
		},
		fnSelectedTipoBultoEntregaOC: function (oEvent) {
			var oSource = oEvent.getSource();
			var oSelectItem = oSource.getSelectedItem();
			var jSelectItem = oSelectItem.getBindingContext("oModelGet").getObject();
			var oRow = oSource.getParent();
			var jRow = oRow.getBindingContext("oModel").getObject();
			var arr = that.oModel.getProperty("/oEmbalajeEntregaconOC");
			for (var i = 0; i < arr.length; i++) {
				if (jRow.key == arr[i].key) {
					arr[i].TipoBultoDesc = jSelectItem.DescripcionCampo;
				}
			}
			that.oModel.setProperty("/oEmbalajeEntregaconOC", arr);
		},
		fnPressEmbCantidadParcial: function () {
			var tablaBultos = that._byId(this.frgIdPackingOC + "--tbEntConOC")
			var tableMateriales = that._byId(this.frgIdPackingOC + "--tbItemsConOC");
			var SeleccionMateriales = tableMateriales.getSelectedIndices();
			var SeleccionBultos = tablaBultos.getSelectedIndices();
			var Materiales = that.oModel.getProperty("/oEmbalajeItemsconOC");
			var validarCantidadParcial = false;
			var validarCantidadParcialTotal = false;
			var Bultos = that.oModel.getProperty("/oEmbalajeEntregaconOC");
			var Data = [];
			var ArraySeleccionados = [];
			var MaterialesSelecionado = [];
			var validad;
			var DataTipoBulto = that.oModel.getProperty("/oEmbalajeEntregaconOC");
			var TipoBultoNombre;
			if (SeleccionMateriales.length === 0) {
				utilUI.onMessageErrorDialogPress2(this.getI18nText("sErrorNotSelectMat"));
				return;
			}

			if (SeleccionBultos.length === 0) {
				utilUI.onMessageErrorDialogPress2(this.getI18nText("sErrorNotSelectEmbSin"));
				return;
			}

			var context = tablaBultos.getContextByIndex(SeleccionBultos[0]);
			var oBjeto = context.getObject();

			if (oBjeto.booleanComp) {
				utilUI.onMessageErrorDialogPress2(this.getI18nText("sErrorNotEmbBulComp"));
				return;
			}

			SeleccionMateriales.forEach(function (e) {
				var Mat = {
					Mat: "",
					Cant: 0.000,
					Orden: "",
					Pos: ""
				};
				Bultos.forEach(function (d) {
					d.Array.forEach(function (f) {
						if (!f.booleanComp) {
							if (f.MatnrD === Materiales[e].MatnrD && f.EbelnD === Materiales[e].EbelnD && f.EbelpD === Materiales[e].EbelpD) {
								Mat.Mat = f.MatnrD;
								Mat.Pos = f.EbelpD;
								Mat.Cant += parseFloat(f.MengezuD.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", ""));
								Mat.Orden = f.EbelnD;

							}
						}
					});
				});

				Materiales.forEach(function (b) {
					if (Materiales[e].MatnrD === b.MatnrD && b.EbelnD === Materiales[e].EbelnD && b.EbelpD === Materiales[e].EbelpD) {
						Mat.Cant += parseFloat(b.MengezuD.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", ""));
						Mat.Pos = b.EbelpD;
						Mat.Mat = b.MatnrD;
						Mat.Orden = b.EbelnD;
					}
				});
				ArraySeleccionados.push(Mat);
			});
			var validar = false;

			ArraySeleccionados.forEach(function (g) {
				SeleccionMateriales.forEach(function (e) {
					if (g.Mat === Materiales[e].MatnrD && g.Orden === Materiales[e].EbelnD && g.Pos === Materiales[e].EbelpD && parseFloat(g.Cant) >
						that.replaceNotAll(Materiales[e].CantTotal)) {
						validar = true;
					}
				});
			});

			if (validar) {
				utilUI.onMessageErrorDialogPress2(this.getI18nText("sErrorNotExeCantTot"));
				return;
			}
			SeleccionMateriales.reverse().forEach(function (a) {
				var totalAcumulado;
				ArraySeleccionados.forEach(function (j) {
					if (j.Mat === Materiales[a].MatnrD && j.Orden === Materiales[a].EbelnD && j.Pos === Materiales[a].EbelpD) {
						totalAcumulado = j.Cant;
					}
				});

				Materiales[a].TipoBulto = TipoBultoNombre;
				MaterialesSelecionado.push(JSON.parse(JSON.stringify(Materiales[a])));
				Materiales[a].MengezuD = that.currencyFormat((that.replaceNotAll(Materiales[a].CantTotal) - parseFloat(totalAcumulado)).toString());

				if (parseFloat(Materiales[a].CantTotal.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "")) -
					parseFloat(totalAcumulado) === 0) {
					Materiales.splice(a, 1);
					tablaBultos.clearSelection();
					tableMateriales.clearSelection();
				}

			});

			var context = tablaBultos.getContextByIndex(SeleccionBultos[0]);
			var oBjeto = context.getObject();
			MaterialesSelecionado.forEach(function (a) {
				var validar = false;
				oBjeto.Array.forEach(function (d) {
					if (d.MatnrD === a.MatnrD && a.EbelnD === d.EbelnD && a.EbelpD === d.EbelpD) {
						d.MengezuD = that.FormatterDinero(parseFloat(d.MengezuD.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(
							",", "")) + parseFloat(a.MengezuD.replace(",", "").replace(",", "").replace(",", "").replace(",", "").replace(",", "")));
						validar = true;
					}
				});

				if (!validar) {
					oBjeto.Array.push(a);
				}
			});

			var arrNumber = []
			oBjeto.Array.forEach(function (x) {
				if (!x.booleanComp) {
					arrNumber.push(x);
				}
			})

			that.oModel.setProperty("/oEmbalajeItemsconOC", Bultos);
			that.oModel.setProperty("/oEmbalajeItemsconOC", Materiales);

			that.getMessageBox("success", that.getI18nText("sSuccessEmbalar") + " " + arrNumber.length.toString() + " " + that.getI18nText(
				"sSuccessEmbalar2") + " " + oBjeto.Num);
		},
		fnPressGuardarOC: function (oEvent) {
			var Bultos = that.oModel.getProperty("/oEmbalajeEntregaconOC");
			var array = [];
			var validarMaterialVacio = false;
			var validarBulto = false;
			var validarBultoComplementario = false;
			var validarBultoCero = false;
			var validarBultoCeroComplementario = false;

			if (Bultos.length === 0) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSaveOC4"));
				return;
			}
			Bultos.forEach(function (a) {
				var filter = a.Array.filter(function (xx) {
					if (xx.booleanComp) {
						return !xx;
					} else {
						return xx;
					}
				});
				if (filter.length === 0) {
					validarMaterialVacio = true;
				}
			});

			if (validarMaterialVacio) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSaveOC5"));
				return;
			}

			Bultos.forEach(function (ab) {
				if (that.isEmpty(ab.Altura) || that.isEmpty(ab.Ancho) || that.isEmpty(ab.Longitud) || that.isEmpty(ab.Observacion) || that.isEmpty(ab.PesoBulto) || that.isEmpty(ab.TipoBulto)) {
					validarBulto = true;
				}

				if (parseInt(ab.Altura) === 0 || parseInt(ab.Ancho) === 0 || parseInt(ab.Longitud) === 0 || parseInt(ab.Observacion) === 0 ||
					parseInt(ab.PesoBulto) === 0) {
					validarBultoCero = true;
				}

				ab.Array.forEach(function (cd) {
					if (cd.booleanComp) {
						if (that.isEmpty(cd.Altura) || that.isEmpty(cd.Ancho) || that.isEmpty(cd.Longitud) || that.isEmpty(cd.Observacion) || that.isEmpty(cd.PesoBulto) || that.isEmpty(cd.TipoBulto)) {
							validarBultoComplementario = true;
						}
						if (parseInt(cd.Altura) === 0 || parseInt(cd.Ancho) === 0 || parseInt(cd.Longitud) === 0 || parseInt(cd.Observacion) === 0 ||
							parseInt(cd.PesoBulto) === 0) {
							validarBultoCeroComplementario = true;
						}
					}
				});
			});

			if (validarBulto) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSaveOC13"));
				return;
			}

			if (validarBultoCero) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSaveOC2"));
				return;
			}

			if (validarBultoComplementario) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSaveOC1"));
				return;
			}

			if (validarBultoCeroComplementario) {
				utilUI.onMessageErrorDialogPress2(that.getI18nText("sErrorSaveOC"));
				return;
			}

			var TextosPedidos = [{
				results: []
			}];
			var arrCont = 0;

			Bultos.forEach(function (a) {
				var EindtpD = "";
				arrCont++;
				a.Array.forEach(function (d) {
					if (d.booleanComp) {
						arrCont++;
					} else {
						EindtpD = d.EindtpD;
					}
				});

				a.Array.forEach(function (d) {
					if (d.booleanComp) {
						d.EindtpD = EindtpD;
					}
				});
			});

			Bultos.forEach(function (a) {
				a.Array.forEach(function (d) {
					var newtdline = "";
					if (d.booleanComp) {
						var ob = {
							VhilmKu: d.Num.toString(),
							Lfdat: that.formatDateAbapInDateGuion(d.EindtpD) + "T00:00:00",
							Laeng: that.replaceNotAll(d.Longitud),
							Breit: that.replaceNotAll(d.Ancho),
							Hoehe: that.replaceNotAll(d.Altura),
							Inhalt: d.Observacion,
							Brgew: that.replaceNotAll(d.PesoBulto),
							Vegr2: d.TipoBulto,
							Ebeln: "",
							Ebelp: "",
							zul_aufpl: "0",
							Tdline: "",
							Matnr: "",
							eindt: that.formatDateAbapInDateGuion(d.EindtpD) + "T00:00:00",
							Menge: "0",
							Meins: ""
						}
						array.push(ob);
					} else {
						newtdline = "";

						var ob = {
							VhilmKu: a.Num.toString(),
							Lfdat: that.formatDateAbapInDateGuion(d.EindtpD) + "T00:00:00",
							Laeng: that.replaceNotAll(a.Longitud),
							Breit: that.replaceNotAll(a.Ancho),
							Hoehe: that.replaceNotAll(a.Altura),
							Inhalt: a.Observacion,
							Brgew: that.replaceNotAll(a.PesoBulto),
							Vegr2: a.TipoBulto,
							Ebeln: d.EbelnD,
							Ebelp: d.EbelpD,
							zul_aufpl: "0",
							Tdline: newtdline,
							Matnr: d.MatnrD,
							eindt: that.formatDateAbapInDateGuion(d.EindtpD) + "T00:00:00",
							Menge: that.replaceNotAll(d.MengezuD),
							Meins: d.MeinsD
						}
						array.push(ob);

						d.Zet_textospedidoSet.forEach(function (obj) {
							var a = {
								Ebeln: obj.Ebeln,
								Ebelp: obj.Ebelp,
								Tdline: obj.Tdline
							};
							TextosPedidos[0].results.push(a);
						});
					}
				});
			});
			var ara = TextosPedidos[0].results.filter((arr, index, self) =>
				index === self.findIndex((t) => (t.Ebeln === arr.Ebeln && t.Ebelp === arr.Ebelp && t.Tdline === arr.Tdline)))
			
			var today = new Date();
			var hours = this.addZero(today.getHours());
			var min = this.addZero(today.getMinutes());
			
			var data2 = {
				"Zflag": "X",
				"Lfdat": that.getYYYYMMDDGUION(today) + "T00:00:00",
				"Lfuhr": "PT" + hours + "H" + min + "M",
				"Anzpk": arrCont.toString(),
				"ZDETALLE": array,
				"ZETPEDIDOTEXTSet": ara,
				"ZETRESULTADOSet": [{
					"Codigo": "",
					"Msg": "",
					"Type": ""
				}]
			};
			
			sap.ui.core.BusyIndicator.show(0);
			var oResults = {
				"oResults" : data2
			};
			Services.RegistrarEntregaConOC(that, oResults, function (result) {
				util.response.validateFunctionEndButton(result, {
					success: function (data, message) {
						that._onPressCancelDialog();
						that._onPressCancelDialog();
					},
					error: function (message) {
						Busy.close();
					}
				});
			});
			
		},
		_onPressCancelDialog: function(){
			this.getModel("oModel").setProperty("/oEmbalajeEntregaconOC", []);
			this.getModel("oModel").setProperty("/oEmbalajeItemsconOC", []);
			that["_dialogPackingOC"].getContent().forEach(function(value){
				value.clearSelection(true);
			});
			that["_dialogPackingOC"].close();
		},
		_onPressCancel: function () {
			this.fnClearComponent();
			this.fnClearData();
			that.oRouter.navTo("RouteMain");
		},
	});
});
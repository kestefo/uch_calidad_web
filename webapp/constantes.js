sap.ui.define([
], function () {
	"use strict";
	return {
		idProyecto: "tomapedido",
		PaginaHome: "Main",
		IdApp: "Solicitar_Cita",
		modelOdata: "modelOdata",
		root: "/",
		userApi: "API-USER-IAS",
		services: {
			//////////////////////////////////////////////////////////////////////
			RegistrarAuditoriaSap:"/Service/RegistrarAuditoriaSap/",
			consultarUser:"/General/Estandar/ConsultarUsuario/",
			getoDataEstandar:"/General/Estandar/ConsultarEstandarSimple/",
			postoDataEstandar:"/General/Estandar/InsertarEstandarSimple/",
            getERPStatus: "/Entrega/Service/ConsultarEntregaSinOCPorAprobarEstatus/",
            getERPArea: "/Entrega/Service/getArea/",
			getERPLumpType: "/ERP/sap/opu/odata/sap/ZBVMM_WEB_OC_REL_PEDC_XCONF_SRV/TipoBultoSet?$filter=Spras eq 'S'&$format=json",
			getERPMeasurementUnits: "/ERP/sap/opu/odata/sap/ZBVMM_WEB_UNIDADES_MEDIDA_SRV/UnidadesMedidaSet",
			getERPOrdersToBePackaged: "/ERP/sap/opu/odata/sap/ZBVMM_WEB_OC_REL_PEDC_XCONF_SRV/RelacionPedProvSet?$expand=Zet_textospedidoSet&$",
			getERPWalInOrders: "/ERP/sap/opu/odata/sap/ZBVMM_WEB_OC_REL_PEDC_XCONF_SRV/RelacionPedEntSet?$expand=ZET_EMB_COMPLSet&$",
			OrdersByAppointment: "/ERP/sap/opu/odata/sap/ZBVMM_WEB_OC_REGISTRO_ENTRE_SRV/ZET_ENTREGA_RESet?$expand=ZET_EMB_COMPLSet&$"
		}
	};
});
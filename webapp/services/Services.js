sap.ui.define([
	"../util/utilResponse",
	"../util/utilHttp",
	"../constantes",
	"../estructuras/Estructura"
], function(utilResponse, utilHttp, constantes,Estructura) {
	"use strict";
	return {
		RegistrarAuditoriaSap: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.RegistrarAuditoriaSap, oResults, callback, context);
		},
		getoDataVGenericaCampo: function (context,oFilter,callback) {
			utilHttp.getoData(context,'/VGenericaCampo',oFilter, callback);  //callback(modLocal) --> mockData
		},
		getoDataEstandar:function(context,oResults,callback){
			utilHttp.Post(constantes.services.getoDataEstandar, oResults, callback, context);
		},
		postoDataEstandar:function(context,oResults,callback){
			utilHttp.Post(constantes.services.postoDataEstandar, oResults, callback, context);
		},
		getoDataERPSync:function(context, url, callback){
			utilHttp.ERPGetSync( url, callback);
		},
		getoDataERPAsync:function(context, url, callback){
			utilHttp.ERPGetAsync( url, callback);
		},
		postoDataERPSync:function(context, urlget, urlpost, data, callback){
			utilHttp.ERPPostTokenSync( urlget, urlpost, data, callback);
		},
		postoDataERPAsync:function(context, urlget, urlpost, data, callback){
			utilHttp.ERPPostTokenAsync( urlget, urlpost, data, callback);
		},
		consultarUser:function(context, oResults, callback) {
			utilHttp.Post(constantes.services.consultarUser, oResults, callback, context);
		},
		consultarUser:function(context, oResults, callback) {
			utilHttp.Post(constantes.services.consultarUser, oResults, callback, context);
		},
		consultarHana: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.consultarHana, oResults, callback, context);
		},
		RegistrarEntregaConOC: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.registrarEntregasConOC, oResults, callback, context);
		},
		RegistrarEntregaSinOC: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.registrarEntregasSinOC, oResults, callback, context);
		},
		postDataHanaURL: function (context,urlpost, oResults, callback) {
			utilHttp.Post(urlpost, oResults, callback, context);
		},
		ConsultarEntregaHorariosPorCentro:function(context, oResults, callback){
			utilHttp.Post(constantes.services.consultarHorarioPorCentro, oResults, callback, context);
		},
		DeleteEntregaConOC:function(context, oResults, callback){
			utilHttp.Post(constantes.services.deleteEntregaConOC, oResults, callback, context);
		},
		EliminarEntregaTarget2: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.EliminarEntregaTarget2, oResults, callback, context);
		},
		ValidacionConcurrenciaFecha: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.ValidacionConcurrenciaFecha, oResults, callback, context);
		},
		RegistrarEntregasAprobadas: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.RegistrarEntregasAprobadas, oResults, callback, context);
		},
		InsertarEntregasHana: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.InsertarEntregasHana, oResults, callback, context);
		},
		InsertarEntregasERPHana: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.InsertarEntregasERPHana, oResults, callback, context);
		},
		EliminarCita: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.EliminarCita, oResults, callback, context);
		},
	};
});
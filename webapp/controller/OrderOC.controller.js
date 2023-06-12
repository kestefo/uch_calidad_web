sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "solicitarcitapr/controller/BaseController"
], function (Controller, BaseController) {
    "use strict";

    var that;
    return BaseController.extend("solicitarcitapr.controller.OrderOC", {
        onInit: function () {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("TargetOrderOC").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
            
            this.frgIdUpdateCondEnt = "frgIdUpdateCondEnt";
        },
        handleRouteMatched: function(){
            console.log("entro")
        },
        _onPressCancel: function(){
            that.oRouter.navTo("RouteMain");
        },
        _onPressUpdateCondEnt: function(){
            this.setFragment("_dialogUpdateCondEnt", this.frgIdUpdateCondEnt, "UpdateCondEnt", this);
        },
    });
});
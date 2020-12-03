console.log('Running...');

var WebInfo = {
    getData: async function(){
        var data = {};
        for(var key of Object.keys(WebInfo.data))
            data[key] = await WebInfo.data[key];
        return data;
    },
    data: {},
};

(() => {
    WebInfo.data['key1'] = 'value1';
    WebInfo.data['key2'] = 'value2';
})();

(() => {
    var canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    var gl = canvas.getContext('experimental-webgl');
    var debugRendererInfo = gl.getExtension('WEBGL_debug_renderer_info');
    WebInfo.data['GPUinfo_renderer'] = gl.getParameter(debugRendererInfo.UNMASKED_RENDERER_WEBGL);
    WebInfo.data['GPUinfo_vendor'] = gl.getParameter(debugRendererInfo.UNMASKED_VENDOR_WEBGL);
})();

export { WebInfo };

console.log('Running...');
var WebInfo = {
    getData: async function(){
        return new Promise((resolve, reject) => resolve({key1: 'value1', key2: 'value2'}));
    },
};
export { WebInfo };

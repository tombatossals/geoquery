function findByIp(ip, supernodos) {
    var supernodo = null;
    for (var i=0; i<supernodos.length; i++) {
        var s = supernodos[i];
        for (var j=0; j<s.interfaces.length; j++) {
            var iface = s.interfaces[j];
            var ifaceip= iface.address.split("/")[0];
            if (ip === ifaceip) {
                var supernodo = s;
                break;
            }
        }
        if (supernodo) break;
    }
    if (!supernodo) { console.log(ip) }
    return supernodo;
}

module.exports.findByIp = findByIp;

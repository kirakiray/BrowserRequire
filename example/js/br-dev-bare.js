//暴露内部变量插件（主要方便外部调试查看内部状态）
require.extend(function (baseResources, F, C, R, Global) {
    //暴露全局变量
    F.extend(Global, C, R);
    Global.F = F;
    Global.baseResources = baseResources;
}, 'bare');
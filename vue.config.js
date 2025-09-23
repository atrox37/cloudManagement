module.exports = {
    chainWebpack: (config)=>{
        config.plugin("define").tap((args) => {
            args[0]["process"] = {...args[0]["process.env"]}
            return args;
        });
    },
    devServer: {
        port: Number(process.env.VUE_APP_PORT),
        proxy: {
            '/api': {
                target: 'http://'+process.env.VUE_APP_URL, //对应服务器地址
                changeOrigin: true, //允许跨域
                ws: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    }

}

const { urlencoded } = require('body-parser');
const express = require('express');
const db = require('./db/dbconnection');
const userRouter = require('./routers/userRouter');
const adminRouter=require('./routers/adminRouter')
const staticRouter = require('./routers/staticRouter');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 8000;
app.get('/', (err, res) => {
    res.send(`<div style="text-align:center;padding-top:40px;">
    <h1>Hello world!</h1>
</div> `);
});
app.use(express.urlencoded({limit: '50mb', extended: false }));
app.use(express.json({limit: '50mb'}));
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/static', staticRouter)

app.listen(port, () => {
    console.log(`server are running and port number ${port}`);
})
app.use('/api/v1/', userRouter);
app.use('/api/v1/', adminRouter);
app.use('/api/v1/', staticRouter);
var swaggerDefinition = {
    info: {
        title: "M3 training ",
        version: "1.0.0",
        description: "M3 training",
    },
    host: `localhost:${port}`,
    basePath: "/",
};

var options = {
    swaggerDefinition: swaggerDefinition,
    apis: ["./routers/*.js"],
};

var swaggerSpec = swaggerJsdoc(options);

app.get("/swagger.json", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

// initialize swagger-jsdoc
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
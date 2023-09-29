var host = process.env.HOST || 'http://18.191.152.50';
// global.IMG_URL = `https://ictkars-dev.s3.us-east-2.amazonaws.com/`;
global.IMG_URL = `https://ictkart-pro.s3.us-east-2.amazonaws.com/`;
// https://ictkart-pro.s3.us-east-2.amazonaws.com/
// global.PRODUCT_URL = 'https://ictkars-dev.s3.us-east-2.amazonaws.com/product.jpg';
global.PRODUCT_URL = 'https://ictkart-pro.s3.us-east-2.amazonaws.com/product.jpg';
global.LOCAL_HOST = `${host}`;
global.ALLOWED_IMPORT_FILE_TYPES = ['xlsx', 'ods', 'csv', 'xls', 'xlsm', 'xlsb', 'xlam'];
global.USER_ROLE = {
    user: {
        list: true,
        add: true,
        update: true,
        delete: true,
    },
    role: {
        list: true,
        add: true,
        update: true,
        delete: true,
    },
    order: {
        list: true,
        update: true,
        reject: true,
    },
    product: {
        list: true,
        add: true,
        update: true,
        delete: true,
    }
};
global.PRAMOTIONAL_BANNER = {
    first: {
        image: "",
        targetUrl: ""
    },
    second: {
        image: "",
        targetUrl: ""
    },
    third: {
        image: "",
        targetUrl: ""
    },
    fourth: {
        image: "",
        targetUrl: ""
    }
}
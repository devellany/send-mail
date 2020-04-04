const sendMail = (() => {
    const core = require('@actions/core');
    const nodemailer = require('nodemailer');
    const fs = require('fs');

    function getInputData() {
        return {
            host: core.getInput("host", {required: true}),
            port: parseInt(core.getInput("port", {required: false})),
            account: core.getInput("account", {required: true}),
            password: core.getInput("password", {required: true}),
            from: `${core.getInput("sender", {required: true})} <${core.getInput("from", {required: true})}>`,
            to: readData(core.getInput("to", {required: true})),
            subject: readData(core.getInput("subject", {required: true})),
            body: readData(core.getInput("body", {required: true})),
            contentType: readData(core.getInput("contentType", {required: true})),
            attachments: JSON.parse(readData(core.getInput("attachments", {required: false}))),
        };
    }

    function readData(data) {
        const prefix = 'file://';
        if (!data.startsWith(prefix)) {
            return data;
        }

        return fs.readFileSync(data.replace(prefix, ''), 'utf8');
    }

    function isSecure(port) {
        return port === 465;
    }

    function getBodyKey(contentType) {
        return contentType === 'text/html' ? 'html' : 'text';
    }

    function validAttachments(attachments) {
        return  attachments.filter(row => {
            return typeof row.path !== 'undefined';
        });
    }

    return {
        start: () => {
            try {
                const data = getInputData();

                nodemailer.createTransport({
                    host: data.host,
                    port: data.port,
                    secure: isSecure(data.port),
                    auth: {
                        user: data.account,
                        pass: data.password,
                    }
                }).sendMail({
                    from: data.from,
                    to: data.to,
                    subject: data.subject,
                    [getBodyKey(data.contentType)]: data.body,
                    attachments: validAttachments(data.attachments)
                });
            } catch (e) {
                core.setFailed(e.message)
            }
        }
    };
})();

sendMail.start();

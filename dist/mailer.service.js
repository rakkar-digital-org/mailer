"use strict";
var MailerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const common_1 = require("@nestjs/common");
const previewEmail = require("preview-email");
const mailer_constant_1 = require("./constants/mailer.constant");
const mailer_transport_factory_1 = require("./mailer-transport.factory");
let MailerService = MailerService_1 = class MailerService {
    initTemplateAdapter(templateAdapter, transporter) {
        if (templateAdapter) {
            transporter.use('compile', (mail, callback) => {
                if (mail.data.html) {
                    return callback();
                }
                return templateAdapter.compile(mail, callback, this.mailerOptions);
            });
            if (this.mailerOptions.preview) {
                transporter.use('stream', (mail, callback) => {
                    return previewEmail(mail.data, this.mailerOptions.preview)
                        .then(() => callback())
                        .catch(callback);
                });
            }
        }
    }
    constructor(mailerOptions, transportFactory) {
        this.mailerOptions = mailerOptions;
        this.transportFactory = transportFactory;
        this.transporters = new Map();
        this.mailerLogger = new common_1.Logger(MailerService_1.name);
        if (!transportFactory) {
            this.transportFactory = new mailer_transport_factory_1.MailerTransportFactory(mailerOptions);
        }
        if ((!mailerOptions.transport ||
            Object.keys(mailerOptions.transport).length <= 0) &&
            !mailerOptions.transports) {
            throw new Error('Make sure to provide a nodemailer transport configuration object, connection url or a transport plugin instance.');
        }
        this.templateAdapter = (0, lodash_1.get)(this.mailerOptions, 'template.adapter');
        if (this.mailerOptions.preview) {
            const defaults = { open: { wait: false } };
            this.mailerOptions.preview =
                typeof this.mailerOptions.preview === 'boolean'
                    ? defaults
                    : (0, lodash_1.defaultsDeep)(this.mailerOptions.preview, defaults);
        }
        if (mailerOptions.transports) {
            Object.keys(mailerOptions.transports).forEach((name) => {
                const transporter = this.transportFactory.createTransport(this.mailerOptions.transports[name]);
                this.transporters.set(name, transporter);
                this.verifyTransporter(transporter, name);
                this.initTemplateAdapter(this.templateAdapter, transporter);
            });
        }
        if (mailerOptions.transport) {
            this.transporter = this.transportFactory.createTransport();
            this.verifyTransporter(this.transporter);
            this.initTemplateAdapter(this.templateAdapter, this.transporter);
        }
    }
    verifyTransporter(transporter, name) {
        const transporterName = name ? ` '${name}'` : '';
        transporter.verify()
            .then(() => this.mailerLogger.debug(`Transporter${transporterName} is ready`))
            .catch((error) => this.mailerLogger.error(`Error occurred while verifying the transporter${transporterName}: ${error.message}`));
    }
    verifyAllTransporters() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const transporters = [...this.transporters.values(), this.transporter];
            const transportersVerified = yield Promise.all(transporters.map(transporter => transporter.verify().catch(() => false)));
            return transportersVerified.every(verified => verified);
        });
    }
    sendMail(sendMailOptions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (sendMailOptions.transporterName) {
                if (this.transporters &&
                    this.transporters.get(sendMailOptions.transporterName)) {
                    return yield this.transporters
                        .get(sendMailOptions.transporterName)
                        .sendMail(sendMailOptions);
                }
                else {
                    throw new ReferenceError(`Transporters object doesn't have ${sendMailOptions.transporterName} key`);
                }
            }
            else {
                if (this.transporter) {
                    return yield this.transporter.sendMail(sendMailOptions);
                }
                else {
                    throw new ReferenceError(`Transporter object undefined`);
                }
            }
        });
    }
    addTransporter(transporterName, config) {
        this.transporters.set(transporterName, this.transportFactory.createTransport(config));
        this.initTemplateAdapter(this.templateAdapter, this.transporters.get(transporterName));
        return transporterName;
    }
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = MailerService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(mailer_constant_1.MAILER_OPTIONS)),
    tslib_1.__param(1, (0, common_1.Optional)()),
    tslib_1.__param(1, (0, common_1.Inject)(mailer_constant_1.MAILER_TRANSPORT_FACTORY)),
    tslib_1.__metadata("design:paramtypes", [Object, Object])
], MailerService);

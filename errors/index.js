'use strict';

/**
 * Base error for custom errors thrown by UsersAPI function app.
 */
class BaseError extends Error {
    constructor (message, code) {
        super(message);
        this.name = 'UsersApiFunctionsBaseError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BaseError = BaseError;

class PriceplanNotFoundError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'PriceplanNotFoundError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.PriceplanNotFoundError = PriceplanNotFoundError;

class UsersApiServerError extends BaseError {
    constructor (message, code) {
        super(message, code);
        this.name = 'UsersApiServerError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UsersApiServerError = UsersApiServerError;

class InvalidUUIDError extends BaseError {
    constructor (message, code) {
        super(message, code);
        this.name = 'InvalidUUIDError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.InvalidUUIDError = InvalidUUIDError;

class EmptyRequestBodyError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'EmptyRequestBodyError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.EmptyRequestBodyError = EmptyRequestBodyError;

class DuplicateUserError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'DuplicateUserError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DuplicateUserError = DuplicateUserError;

class DuplicateUserGroupError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'DuplicateUserGroupError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DuplicateUserGroupError = DuplicateUserGroupError;

class DuplicateTeamError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'DuplicateTeamError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DuplicateTeamError = DuplicateTeamError;

class DuplicateUserWidgetsError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'DuplicateUserWidgetsError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DuplicateUserWidgetsError = DuplicateUserWidgetsError;

class UserWidgetsNotFoundError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'UserWidgetsNotFoundError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UserWidgetsNotFoundError = UserWidgetsNotFoundError;

class UserWidgetsNotUpdatedError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'UserWidgetsNotUpdatedError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UserWidgetsNotUpdatedError = UserWidgetsNotUpdatedError;

class UserNotFoundError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'UserNotFoundError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UserNotFoundError = UserNotFoundError;

class UserGroupNotFoundError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'UserGroupNotFoundError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UserGroupNotFoundError = UserGroupNotFoundError;

class ContactsNotFoundError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'ContactsNotFoundError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ContactsNotFoundError = ContactsNotFoundError;

class DuplicateContactsError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'DuplicateContactsError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DuplicateContactsError = DuplicateContactsError;

class TeamNotFoundError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'TeamNotFoundError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.TeamNotFoundError = TeamNotFoundError;

class UserNotAuthenticatedError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'UserNotAuthenticatedError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UserNotAuthenticatedError = UserNotAuthenticatedError;

class FieldValidationError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'FieldValidationError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.FieldValidationError = FieldValidationError;

class MerchantNotFoundError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'MerchantNotFoundError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.MerchantNotFoundError = MerchantNotFoundError;

class PasswordResetRequestError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'PasswordResetRequestError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.PasswordResetRequestError = PasswordResetRequestError;

class UserDeleteError extends BaseError {
    constructor (message, code) {
        super(message);
        this.name = 'UserDeleteError';
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UserDeleteError = UserDeleteError;

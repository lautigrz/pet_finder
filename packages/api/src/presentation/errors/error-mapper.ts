import { DomainError } from "@domain/errors/DomainError";
import { ApplicationError } from "@infrastructure/errors/ApplicationError";


interface HttpError {
    statusCode: number;
    code: string;
    message: string;
}

export function errorToHttpStatus(error: Error): HttpError {
    if (error instanceof DomainError) {
        switch (error.code) {
            case 'EMAIL_ALREADY_EXISTS': return { statusCode: 409, code: error.code, message: error.message };
            case 'INVALID_EMAIL': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_PHONE': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_PASSWORD': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_USERNAME': return { statusCode: 400, code: error.code, message: error.message };
            case 'USER_NOT_FOUND': return { statusCode: 404, code: error.code, message: error.message };
            case 'PET_NOT_FOUND': return { statusCode: 404, code: error.code, message: error.message };
            case 'REPORT_NOT_FOUND': return { statusCode: 404, code: error.code, message: error.message };
            case 'INVALID_VERIFICATION_TOKEN': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_REFRESH_TOKEN': return { statusCode: 401, code: error.code, message: error.message };
            case 'UNAUTHORIZED_REPORT_EDIT': return { statusCode: 403, code: error.code, message: error.message };
            case 'INVALID_STATUS_TRANSITION': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_REPORT_DETAILS': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_REPORT_DESCRIPTION': return { statusCode: 400, code: error.code, message: error.message };
            case 'EMAIL_VERIFICATION_REQUIRED': return { statusCode: 403, code: error.code, message: error.message };
            case 'ADMIN_ACCESS_REQUIRED': return { statusCode: 403, code: error.code, message: error.message };
            case 'EMAIL_VERIFICATION_NOT_FOUND': return { statusCode: 400, code: error.code, message: error.message };
            case 'EMAIL_VERIFICATION_EXPIRED': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_COORDINATES': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_LOCATION': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_FIELD': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_REPORT_TYPE': return { statusCode: 400, code: error.code, message: error.message };
            case 'MAPPING_ERROR': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_IMAGE': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_ANIMAL_TYPE': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_PASSWORD_RESET_TOKEN': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_CREDENTIALS': return { statusCode: 401, code: error.code, message: error.message };
            case 'VALIDATION_ERROR': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_NOTIFICATION_RADIUS': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_MUTED_UNTIL': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_PET_NAME': return { statusCode: 400, code: error.code, message: error.message };
            case 'CONVERSATION_NOT_FOUND': return { statusCode: 404, code: error.code, message: error.message };
            case 'UNAUTHORIZED_CONVERSATION': return { statusCode: 403, code: error.code, message: error.message };
            case 'CONVERSATION_ALREADY_EXISTS': return { statusCode: 409, code: error.code, message: error.message };
            case 'INVALID_CONVERSATION_WITH_ITSELF': return { statusCode: 400, code: error.code, message: error.message };
            case 'INVALID_MESSAGE_TEXT': return { statusCode: 400, code: error.code, message: error.message };
            case 'CANNOT_REPORT_OWN_CONTENT': return { statusCode: 403, code: error.code, message: error.message };
            case 'NOT_CHAT_PARTICIPANT': return { statusCode: 403, code: error.code, message: error.message };
            case 'CONTENT_ALREADY_REPORTED': return { statusCode: 409, code: error.code, message: error.message };
            case 'INVALID_REPORT_REASON': return { statusCode: 400, code: error.code, message: error.message };
            case 'REPORTED_CONTENT_NOT_FOUND': return { statusCode: 404, code: error.code, message: error.message };
            case 'CONTENT_REPORT_NOT_FOUND': return { statusCode: 404, code: error.code, message: error.message };
            case 'SUSPENSION_REASON_REQUIRED': return { statusCode: 400, code: error.code, message: error.message };
            case 'MATCH_RESULT_NOT_FOUND': return { statusCode: 404, code: error.code, message: error.message };
            case 'PAYMENT_NOT_FOUND': return { statusCode: 404, code: error.code, message: error.message };
            case 'REPORT_ALREADY_FEATURED': return { statusCode: 409, code: error.code, message: error.message };
            case 'UNAUTHORIZED_FEATURE_REPORT': return { statusCode: 403, code: error.code, message: error.message };
            case 'INVALID_WEBHOOK_SIGNATURE': return { statusCode: 401, code: error.code, message: error.message };
        }
    }

    if (error instanceof ApplicationError) {
        return { statusCode: 500, code: error.code, message: error.message };
    }


    switch (error.name) {
        case 'InvalidFieldError': return { statusCode: 400, code: 'INVALID_FIELD', message: error.message };
        case 'InvalidReportTypeError': return { statusCode: 400, code: 'INVALID_REPORT_TYPE', message: error.message };
        case 'MappingError': return { statusCode: 400, code: 'MAPPING_ERROR', message: error.message };
        case 'MissingFieldError': return { statusCode: 400, code: 'MISSING_FIELD', message: error.message };
    }

    return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

//error
export const handleError = (res, error, statusCode = 500) => {
    console.error("ERROR", error);

    return res.status(statusCode).json({
        sucess: false,
        message: error.message
    });
};

export const handleNotFound = (res, message = "Not found") => {
    return res.status(404).json({
        sucess: false,
        message
    });
};

export const handleBadResquet = (res, message) => {
    return res.status(400).json({
        success: false,
        message
    });
};

//success

export const handleSuccess = (res, data, message) => {
    return res.status(200).json({
        sucess: true,
        message,
        data
    });
};

export const handleNoContent = (res, message) => {
    return res.status(200).json({
        sucess: true,
        message
    });
};
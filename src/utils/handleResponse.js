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

//success

export const handleSucess = (res, data, message) => {
    return res.status(200).json({
        sucess: true,
        message,
        data
    });
};
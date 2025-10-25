export const handleError = (res, error, statusCode = 500) => {
    console.error("ERROR", error);

    return res.status(statusCode).json({
        sucess: false,
        message: error.message
    });
}
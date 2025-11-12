# BoxPremier Backend API

API backend para gestionar la plataforma BoxPremier, construida con **Node.js**, **Express** y **MongoDB**.

---

## Tecnologías

- Node.js
- Express
- MongoDB / Mongoose
- JWT para autenticación
- Bcrypt para contraseñas
- Jest + Supertest para pruebas
- Dotenv para variables de entorno
- Helmet y CORS para seguridad
- Morgan para logs

---

## Arquitectura del proyecto

```
boxpremier-server/
├── src/
    ├── config/
    ├── controllers/
    ├── database/
    ├── middlewares/
    ├── models/
    ├── routes/
    ├── utils/
    ├── validations/
├── tests/
├── .env
├── .env.test
├── .gitignore
├── app.js
├── README.md
├── package.json
├── package-lock.json
```` 
- **src/**: Contiene la lógica principal de la aplicación, incluyendo servicios, utilidades y otros módulos centrales.
- **config/**: Configuraciones generales y de entorno.
- **controllers/**: Lógica de negocio y controladores de las rutas.
- **database/**: Gestión de la base de datos.
- **middlewares/**: Para autenticación, validación y control de acceso.
- **models/**: Definición de los modelos de datos.
- **routes/**: Definición de las rutas de la API.
- **utils/**: Funciones auxiliares reutilizables.
- **validations/**: Funciones para la validación de datos.
- **tests/**: Pruebas unitárias y de integración.
- **app.js**: Punto de entrada de la aplicación.
- **package.json / package-lock.json**: Dependencias y scripts del proyecto.

## Implementaciones y uso

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/BOXPREMIER/boxpremier-server.git
   ```
2. Accede al directorio del proyecto:
   ```bash
   cd boxpremier-server
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
### Archivo .env.example

Incluye variables como:

- Crea el archivo `.env`
    ```
    HOST=
    PORT=
    MONGO_URI=
    JWT_SECRET=
    JWT_EXPIRES=7d
    NODE_ENV=development
    ```
- Crea el archivo `.env.test`
    ```
    HOST=
    PORT=
    MONGO_URI=
    JWT_SECRET=
    JWT_EXPIRES=7d
    NODE_ENV=test
    ```
### Ejecución

- npm run dev – Ejecuta el servidor en modo desarrollo
- npm start – Ejecuta el servidor normal
- npm test – Ejecuta pruebas unitarias y de integración
- npm run test:coverage – Ejecuta pruebas y genera reporte de cobertura

### Ejemplo de uso

Una vez iniciado, consulta la colección de Postman incluida en la documentación para ejemplos de endpoints y peticiones.

## Estructura de colecciones

![Diagrama](./docs/img/xxx)

## Documentación de la API

La documentación detallada de los endpoints, parámetros y respuestas está disponible en una colección de Postman junto con el repositorio.

[Clique aquí](https://documenter.getpostman.com/view/46421388/2sB3WttK9M)

## Contacto

Para consultas o soporte:
- **Organización:** [BoxPremier](https://github.com/BOXPREMIER)
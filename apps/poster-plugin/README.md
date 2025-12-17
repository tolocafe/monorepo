# Poster POS Platform Boilerplate

POS Platform Boilerplate is a template for creating applications on the POS platform.

How to get started is described in the [Getting Started](https://github.com/joinposter/pos-platform-boilerplate#getting-started) section. After launching, you can start developing your application directly in this project.

Applications on the POS platform run on JavaScript.
You can write the application in any language that compiles to JS (CoffeeScript, TypeScript).
The application is loaded into the system as a single JS file (bundle) which is built using [vite](https://vitejs.dev/).

To create the application interface, you can use any framework or libraries.
For example, Backbone, VueJS, Angular, React. For instance, the Poster interface is written in [React](https://reactjs.org/).

### Getting Started

1. Clone the repository

2. Navigate to the project folder and run:

> **Make sure you have node v20.14.0**

```bash
npm install
npm run dev
```

3. Log in to the native POS application in your account: `https://pos.ps`. Use the login and password you specified during registration, the default waiter pin code is 0000.

4. In the top left, click on the prod</> tab, switch your application to development mode. Enter the address `https://localhost:5173`

5. Open an order and pay for it. After closing the bill, the Boilerplate application will show a popup.

6. Hooray, you've launched your first application on the platform 🎉

### Application Examples

To run one of the examples, change the component in the `src/js/App.jsx` file

[Hello World](https://github.com/joinposter/pos-platform-boilerplate/tree/master/examples/hello-world) – Shows how to modify the Poster terminal interface and display your own interface.

[Loyalty System](https://github.com/joinposter/pos-platform-boilerplate/tree/master/examples/loyalty) – Shows how to work with orders, find guests by phone number and create new ones. Set discounts on orders.

[Hotel Management System](https://github.com/joinposter/pos-platform-boilerplate/tree/master/examples/pms) – Example application for hotel management

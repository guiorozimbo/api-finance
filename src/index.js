const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());
const customers = [];

function getBalance(statement){
    const balance = statement.reduce((acc,operation)=>{
        if (operation.type === "credit"){
            return acc + operation.amount
        }else{
            return acc - operation.amount
        }
    },0);
    return balance;
}

function verifyIfExistsAccountCPF(request,response,next){
    const {cpf} = request.headers;
    const customer = customers.find((customer)=>
        customer.cpf === cpf
    );
    if(!customer){
        return response.status(400).json(
            {
                error: "Customer not found"
            }
        );
    }
    request.customer = customer;
    return next();
}

/*app.put("/account/cpf",(request,response)=>{
    const { cpf, id } = request.body;
    const customer = customers.find((customer)=>customer.id === id);
    if(!customer){
        return response.status(400).json(
            {
                error: "Customer not found"
            }
        );
    }
    customer.cpf = cpf;
    return response.status(202).json(customer);
});*/

//Cadastrar um conta
app.post("/account",(request,response)=>{
    const {cpf,name} = request.body;
    const customerAlreadyExists = customers.some((customer)=>
        customer.cpf === cpf
    );
    if(customerAlreadyExists) {
        return response.status(400).json(
            {
                error: "Customer already exists"
            }
        );
    }
    //crio o objeto é a conta do cliente 
    const customer = {
        cpf,
        name,
        id: uuidv4(),
        statement: []
    }
    //adiciono o cliente no array
    customers.push(customer);
    return response.status(201).send();
});
//Listar todas as conta
app.get("/account/all",(request, response)=>{
    return response.json(customers);
});
//Listar uma conta por cpf
app.get("/account",verifyIfExistsAccountCPF,(request, response)=>{
    const { customer } = request;
    return response.json(customer);
});
//Listar um extrato de um usuário pelo cpf
app.get("/statement",verifyIfExistsAccountCPF,(request,response)=>{
    const {customer} = request;
    return response.json(customer.statement);    
});
//Realizar um deposito na conta pelo cpf
app.post("/deposit",verifyIfExistsAccountCPF,(request,response)=>{
    const { description, amount } = request.body;
    const { customer } = request;
    //Criando o objeto com os dados da operacao bancaria
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }
    //adicionando a operacao nas transacoes/extrato bancario
    customer.statement.push(statementOperation);
    return response.status(201).send();
});
//Realizar um saque na conta pelo cpf
app.post("/withdraw",verifyIfExistsAccountCPF,(request,response)=>{
    const { amount } = request.body;
    const { customer } = request;
    const balance = getBalance(customer.statement);
    if (balance < amount){
        return response.status(400).json(
            {
                error: "Insufficient funds!"
            }
        );
    }
    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }
    customer.statement.push(statementOperation);
    return response.status(201).send();
});
//Listar um extrato de um usuário pelo cpf por data
app.get("/statement/date",verifyIfExistsAccountCPF,(request,response)=>{
    const { customer } = request;
    const { date } = request.query;
    const dateFormat = new Date(date +" 00:00");
    const statement = customer.statement.filter(
        (statement)=>
        statement.created_at.toDateString() === 
        new Date(dateFormat).toDateString()
    );
    return response.json(statement);
});
//Alterando o nome do usuario da conta pelo cpf
app.put("/account",verifyIfExistsAccountCPF,(request,response)=>{
    const { name } = request.body;
    const { customer } = request;
    customer.name = name;
    return response.status(204).send();
});


app.listen(3333);

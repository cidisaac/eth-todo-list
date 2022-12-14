App = {
    loading: false,
    contracts: {},
    load: async () => {
        //Load app...
        console.log("app loading")
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
    },
// https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider
        web3 = new Web3(web3.currentProvider)
        } else {
        window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
        window.web3 = new Web3(ethereum)
        try {
            // Request account access if needed
            await ethereum.enable()
            // Acccounts now exposed
            web3.eth.sendTransaction({/* ... */})
        } catch (error) {
            // User denied account access...
        }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
        App.web3Provider = web3.currentProvider
        window.web3 = new Web3(web3.currentProvider)
        // Acccounts always exposed
        web3.eth.sendTransaction({/* ... */})
        }
        // Non-dapp browsers...
        else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
    },

    loadAccount: async () => {
        // Set the current blockchain account
        const accounts = await web3.eth.getAccounts()
        web3.eth.defaultAccount = accounts[0]
        App.account = accounts[0]
    },

    loadContract: async () => {
        const todoList = await $.getJSON('TodoList.json')
        App.contracts.TodoList = TruffleContract(todoList)
        App.contracts.TodoList.setProvider(App.web3Provider)

        //Hydrate the smart contract with values from the blockchain
        App.todoList = await App.contracts.TodoList.deployed()
    },

    render: async () => {
        if (App.loading) {
            return
        }

        App.setLoading(true)

        //Render the account
        $('#account').html(App.account)

        //Render tasks
        await App.renderTasks()

        App.setLoading(false)

    },

    renderTasks: async () => {
        //Load the total task count from the blockchain
        const taskCount = await App.todoList.taskCount()
        const $taskTemplate = $('.taskTemplate')

        //Render out each task with a new task template
        for (let i = 1; i <= taskCount; i++) {
            //Fetch all tasks
            const task = await App.todoList.tasks(i)
            const taskId = task[0].toNumber()
            const taskContent = task[1]
            const taskCompleted = task[2]

            //Create the html for the task
            const $newTaskTemplate = $taskTemplate.clone()
            $newTaskTemplate.find('.content').html(taskContent)
            const input = $newTaskTemplate.find('input')
            .attr('name', taskId)
            .attr('checked', taskCompleted)
            .click(App.toggleCompleted)            

            //Put the task in the correct list
            if (taskCompleted) {
                $('#completedTaskList').append($newTaskTemplate)
            } else {
                $('#taskList').append($newTaskTemplate)
            }

            //Show the task
            $newTaskTemplate.show()
        }        
    },

    createTask: async () => {
        App.setLoading(true)
        const content = $('#newTask').val()
        await App.todoList.createTask(content, {from: web3.eth.defaultAccount})
        window.location.reload()
    },
    
    toggleCompleted: async (e) => {
        console.log('CB BREO', e.target)
        App.setLoading(true)
        console.log('INSTA BRO')
        const taskId = e.target.name
        console.log('ID: ', taskId)
        await App.todoList.toggleCompleted(taskId, {from: web3.eth.defaultAccount})
        window.location.reload()
    },

    setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if (boolean) {
            loader.show()
            content.hide()
        } else {
            loader.hide()
            content.show()
        }
    }
}


$(() => {
    $(window).load(() => {
        App.load()
    })
})
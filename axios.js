const axios = require("axios").default;

// axios
//     .get('http://localhost:5000/v1/travelgroup/read')
//     .then(res => console.log(res.error))
//     .catch(err => console.log(err));

// let data;
// const getSingleGroup = async () => {
//     await axios
//         .get('http://localhost:5000/v1/travelgroup/read')
//         .then(res => {
//             data = res.data
//             console.log('Not reach');
//         })
//         .catch(err => console.log(err));

//     console.log(data.success);
// }

// getSingleGroup();

// axios
//     .get('http://localhost:5000/v1/travelgroup/read')
//     .then(res => console.log(res))
//     .catch(err => console.log(err));

const getGroups = async () => {
  try {
    const { data, error, success } = await axios.get(
      "http://localhost:5000/v1/travelgroup/read/6036f47861db3561f0c951ad"
    );
    console.log(data.data);
    //console.log(success);
  } catch (err) {
    console.log(err.response.data.error);
  }
};

getGroups();

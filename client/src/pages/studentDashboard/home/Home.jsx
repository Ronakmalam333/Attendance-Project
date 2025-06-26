import React from 'react'
import './home.css'
import Details from './details/Details';
import Token from './token/Token';
// import StuToken from './token/StuToken';
// import StaffToken from './token/StaffToken';

function Home() {
  const role = localStorage.getItem("role");
  return (
    <div className="home-contain">

      <div className='home'>
        <Details />
        <Token />
      </div>

    </div>
  )
}

export default Home

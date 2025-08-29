import React, { useContext } from 'react'
import './home.css'
import Details from './details/Details';
import Token from './token/Token';
import { AuthContext } from '../../../context/AuthContext';

function Home() {
  const { user } = useContext(AuthContext);
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

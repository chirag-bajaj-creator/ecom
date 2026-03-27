import {createContext,useContext, useState} from 'react';

const AuthModalContext = createContext();

const AuthModalProvider = ({ children }) => {
    const [modalType, setModalType] = useState(null);


 const openLogin = () => setModalType('login');
 const openSignup = () => setModalType('signup');
 const closeAuthModal = () => setModalType(null);

  return (
    <AuthModalContext.Provider value={{modalType,openLogin,openSignup,closeAuthModal}}>{children}</AuthModalContext.Provider>
  );
};

export const useAuthModal = () => useContext(AuthModalContext);
export default AuthModalProvider;
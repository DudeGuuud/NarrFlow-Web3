import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Story from '../pages/Story';
import Create from '../pages/Create';
import Profile from '../pages/Profile';
import LatestStory from '../pages/Story/Latest';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/story/:id',
    element: <Story />,
  },
  {
    path: '/create',
    element: <Create />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/story/latest',
    element: <LatestStory />,
  },
]);
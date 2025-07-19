// Update this page (the content is just a fallback if you fail to update the page)
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
        <div className="mt-6 flex gap-3 flex-wrap">
          <Link to="/support" className="text-primary underline">Support & Help</Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

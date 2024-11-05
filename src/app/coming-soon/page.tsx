export default function ComingSoonPage() {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4">
        <main className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-4">Coming Soon!</h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-12">
            We're gearing up for something exciting. Stay tuned for our launch!
          </p>
          
          {/* TODO
          Add in a placeholder image
          */}
  
          <p className="text-lg text-gray-600 mb-8">
            We're working hard to bring you an amazing experience. 
            Check back soon for updates and exciting news!
          </p>
        </main>
        <footer className="mt-16 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} The Run Club. All rights reserved.</p>
        </footer>
      </div>
    )
  }
import Image from "next/image"
import { Star } from "lucide-react"

export default function TestimonialCard() {
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-3xl shadow-[0px_0px_18.26px_0px_#00000014]">
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <p className="text-gray-600 text-md mb-8">
        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's
        standard dummy text ever. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
        has b een the industry's standard dummy text ever.
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/assets/images/Avatar/user1.png"
            alt="Profile of Albert"
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <h3 className="text-3xl font-medium text-gray-700">Albert</h3>
            <p className="text-gray-500 text-xl">Jun 20, 2025</p>
          </div>
        </div>

        <div className="text-gray-400">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M65 15C53.9543 15 45 23.9543 45 35C45 46.0457 53.9543 55 65 55C65 70 50 75 40 75"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M25 15C13.9543 15 5 23.9543 5 35C5 46.0457 13.9543 55 25 55C25 70 10 75 0 75"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}


import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import SearchBar from "./search-bar";
import { Button } from "./ui/button";

const Header = () => {
	return (
		<div className="border-b">
			<div className="flex flex-col lg:flex-row items-center gap-4 p-4">
				<div className="flex items-center justify-between w-full lg:w-auto">
					<Link href={"/"} className="font-bold shrink-0">
						<Image
							src={"/fffav.ico"}
							alt="logo"
							width={100}
							height={100}
							className="w-8 lg:w-10"
						/>
					</Link>
					<div className="lg:hidden">
						<SignedIn>
							<UserButton />
						</SignedIn>
						<SignedOut>
							<SignInButton mode="modal">
								<button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition-all border border-gray-300">
									Sign In
								</button>
							</SignInButton>
						</SignedOut>
					</div>
				</div>
				<div className="w-full lg:max-w-2xl">
					<SearchBar />
				</div>

				<div className="hidden lg:block ml-auto">
					<SignedIn>
						<div className="flex items-center gap-3">
							<Link href={"/seller"}>
								<Button className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition">
									Sell Tickets
								</Button>
							</Link>
							<Link href={"/tickets"}>
								<Button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
									My Tickets
								</Button>
							</Link>

							<UserButton />
						</div>
					</SignedIn>
					<SignedOut>
						<SignInButton mode="modal">
							<Button className="bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
								Sign In
							</Button>
						</SignInButton>
					</SignedOut>
				</div>
				{/* mobile action buttons */}
				<div className="lg:hidden w-full flex justify-center gap-3">
					<SignedIn>
						<Link href={"/seller"} className="flex-1">
							<Button className="w-full bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition">
								Sell Tickets
							</Button>
						</Link>
						<Link href={"/tickets"} className="flex-1">
							<Button className="w-full bg-gray-100 text-gray-800 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300">
								My Tickets
							</Button>
						</Link>
					</SignedIn>
				</div>
			</div>
		</div>
	);
};

export default Header;

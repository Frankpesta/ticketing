/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "terrific-swan-222.convex.cloud",
				port: "", // Leave empty for default HTTPS port (443)
				pathname: "/api/storage/**", // Allow all paths under /api/storage/
			},
		],
	},
};

export default nextConfig;

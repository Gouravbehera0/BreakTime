package com.breaktime.app.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.breaktime.app.data.activity.ActivityRepository
import com.breaktime.app.data.activity.DefaultActivityRepository
import com.breaktime.app.data.auth.AuthRepository
import com.breaktime.app.data.contact.ContactRepository
import com.breaktime.app.data.contact.DefaultContactRepository
import com.breaktime.app.data.contact.DefaultInvitationRepository
import com.breaktime.app.data.contact.InvitationRepository
import com.breaktime.app.data.contact.SharedPrefsPinPreferencesRepository
import com.breaktime.app.data.friends.DefaultFriendRepository
import com.breaktime.app.data.friends.FriendRepository
import com.breaktime.app.data.friends.PhoneContactReader
import com.breaktime.app.domain.auth.AuthState
import com.breaktime.app.ui.auth.ForgotPasswordScreen
import com.breaktime.app.ui.auth.ForgotPasswordViewModel
import com.breaktime.app.ui.auth.LoginScreen
import com.breaktime.app.ui.auth.LoginViewModel
import com.breaktime.app.ui.auth.OtpVerificationScreen
import com.breaktime.app.ui.auth.OtpVerificationViewModel
import com.breaktime.app.ui.auth.ProfileSetupScreen
import com.breaktime.app.ui.auth.ProfileSetupViewModel
import com.breaktime.app.ui.auth.RegisterScreen
import com.breaktime.app.ui.auth.RegisterViewModel
import com.breaktime.app.ui.friends.FriendsScreen
import com.breaktime.app.ui.friends.FriendsViewModel
import com.breaktime.app.ui.home.HomeScreen
import com.breaktime.app.ui.home.HomeViewModel
import com.breaktime.app.ui.invitation.InvitationScreen
import com.breaktime.app.ui.invitation.InvitationViewModel
import kotlinx.coroutines.launch

@Composable
fun AppNavGraph(
    authRepository: AuthRepository,
    modifier: Modifier = Modifier,
    contactRepository: ContactRepository? = null,
    invitationRepository: InvitationRepository? = null,
    activityRepository: ActivityRepository? = null,
    friendRepository: FriendRepository? = null,
    phoneContactReader: PhoneContactReader? = null,
    navController: NavHostController = rememberNavController()
) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    val resolvedContactRepo = remember(contactRepository) {
        contactRepository ?: DefaultContactRepository(SharedPrefsPinPreferencesRepository(context))
    }
    val resolvedInvitationRepo = remember(invitationRepository) {
        invitationRepository ?: DefaultInvitationRepository(authRepository)
    }
    val resolvedActivityRepo = remember(activityRepository) {
        activityRepository ?: DefaultActivityRepository(context)
    }
    val resolvedFriendRepo = remember(friendRepository) {
        friendRepository ?: DefaultFriendRepository()
    }
    val resolvedPhoneContactReader = remember(phoneContactReader) {
        phoneContactReader ?: PhoneContactReader(context)
    }

    val authState by authRepository.authState.collectAsState()

    // Determine startup destination based on existing session
    val initialUser = authRepository.getCurrentUser()
    val startDestination = when {
        initialUser == null -> Routes.LOGIN
        !initialUser.isProfileComplete -> Routes.PROFILE_SETUP
        else -> Routes.HOME
    }

    // Automatically navigate on authentication state changes:
    // - On subsequent launches or successful login: restore session and open Home or Profile Setup
    // - On sign out or session invalidation: return to Login
    LaunchedEffect(authState) {
        val current = authState
        when (current) {
            is AuthState.Authenticated -> {
                val currentRoute = navController.currentBackStackEntry?.destination?.route
                val targetDestination = if (current.user.isProfileComplete) Routes.HOME else Routes.PROFILE_SETUP
                if (currentRoute != targetDestination && currentRoute != Routes.INVITATION) {
                    navController.navigate(targetDestination) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            }
            is AuthState.Unauthenticated -> {
                val currentRoute = navController.currentBackStackEntry?.destination?.route
                if (currentRoute == Routes.HOME || currentRoute?.startsWith("invitation") == true || currentRoute == Routes.PROFILE_SETUP) {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            }
            else -> { /* Initial or Loading */ }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier,
        enterTransition = {
            fadeIn(animationSpec = tween(300)) + slideIntoContainer(
                AnimatedContentTransitionScope.SlideDirection.Start,
                animationSpec = tween(300)
            )
        },
        exitTransition = {
            fadeOut(animationSpec = tween(300)) + slideOutOfContainer(
                AnimatedContentTransitionScope.SlideDirection.Start,
                animationSpec = tween(300)
            )
        },
        popEnterTransition = {
            fadeIn(animationSpec = tween(300)) + slideIntoContainer(
                AnimatedContentTransitionScope.SlideDirection.End,
                animationSpec = tween(300)
            )
        },
        popExitTransition = {
            fadeOut(animationSpec = tween(300)) + slideOutOfContainer(
                AnimatedContentTransitionScope.SlideDirection.End,
                animationSpec = tween(300)
            )
        }
    ) {
        composable(Routes.LOGIN) {
            val loginViewModel: LoginViewModel = viewModel {
                LoginViewModel(authRepository)
            }

            LoginScreen(
                viewModel = loginViewModel,
                onNavigateToRegister = {
                    navController.navigate(Routes.REGISTER)
                },
                onNavigateToForgotPassword = {
                    navController.navigate(Routes.FORGOT_PASSWORD)
                },
                onNavigateToOtp = { phone ->
                    navController.navigate(Routes.createOtpVerifyRoute(phone))
                },
                onLoginSuccess = {
                    val user = authRepository.getCurrentUser()
                    val target = if (user?.isProfileComplete == true) Routes.HOME else Routes.PROFILE_SETUP
                    navController.navigate(target) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Routes.OTP_VERIFY,
            arguments = listOf(
                navArgument("phone") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val rawPhone = backStackEntry.arguments?.getString("phone").orEmpty()
            val decodedPhone = java.net.URLDecoder.decode(rawPhone, "UTF-8")
            val otpViewModel: OtpVerificationViewModel = viewModel(key = decodedPhone) {
                OtpVerificationViewModel(
                    phone = decodedPhone,
                    authRepository = authRepository
                )
            }

            OtpVerificationScreen(
                viewModel = otpViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onVerificationSuccessToHome = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onVerificationSuccessToProfileSetup = {
                    navController.navigate(Routes.PROFILE_SETUP) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.PROFILE_SETUP) {
            val profileSetupViewModel: ProfileSetupViewModel = viewModel {
                ProfileSetupViewModel(authRepository)
            }

            ProfileSetupScreen(
                viewModel = profileSetupViewModel,
                onProfileSetupSuccess = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.REGISTER) {
            val registerViewModel: RegisterViewModel = viewModel {
                RegisterViewModel(authRepository)
            }

            RegisterScreen(
                viewModel = registerViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                onRegisterSuccess = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.FORGOT_PASSWORD) {
            val forgotPasswordViewModel: ForgotPasswordViewModel = viewModel {
                ForgotPasswordViewModel(authRepository)
            }

            ForgotPasswordScreen(
                viewModel = forgotPasswordViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Routes.HOME) {
            val currentUser = authRepository.getCurrentUser()
            val homeViewModel: HomeViewModel = viewModel {
                HomeViewModel(
                    contactRepository = resolvedContactRepo,
                    invitationRepository = resolvedInvitationRepo,
                    authRepository = authRepository,
                    initialUserId = currentUser?.id,
                    initialUserName = currentUser?.fullName
                )
            }

            HomeScreen(
                viewModel = homeViewModel,
                onNavigateToInvitation = { contactId ->
                    navController.navigate(Routes.createInvitationRoute(contactId))
                },
                onNavigateToFriends = {
                    navController.navigate(Routes.FRIENDS)
                },
                onSignOut = {
                    coroutineScope.launch {
                        authRepository.signOut()
                        navController.navigate(Routes.LOGIN) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
            )
        }

        composable(Routes.FRIENDS) {
            val currentUser = authRepository.getCurrentUser()
            val friendsViewModel: FriendsViewModel = viewModel {
                FriendsViewModel(
                    friendRepository = resolvedFriendRepo,
                    phoneContactReader = resolvedPhoneContactReader,
                    authRepository = authRepository,
                    initialUserId = currentUser?.id
                )
            }

            FriendsScreen(
                viewModel = friendsViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToInvitation = { contactId ->
                    navController.navigate(Routes.createInvitationRoute(contactId))
                }
            )
        }

        composable(
            route = Routes.INVITATION,
            arguments = listOf(
                navArgument("contactId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val contactId = backStackEntry.arguments?.getString("contactId").orEmpty()
            val currentUser = authRepository.getCurrentUser()
            val invitationViewModel: InvitationViewModel = viewModel(key = contactId) {
                InvitationViewModel(
                    contactId = contactId,
                    contactRepository = resolvedContactRepo,
                    invitationRepository = resolvedInvitationRepo,
                    activityRepository = resolvedActivityRepo,
                    authRepository = authRepository,
                    initialUserId = currentUser?.id
                )
            }

            InvitationScreen(
                viewModel = invitationViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
